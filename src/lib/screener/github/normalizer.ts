// ============================================================
// Artifact Normalizer
// Transforms raw GitHub data into a structured ArtifactBundle.
// ============================================================

import { RawArtifactData, RawCommit, RawPullRequest, RawIssue } from './types';
import {
  ArtifactBundle,
  NormalizedCommit,
  NormalizedPR,
  NormalizedIssue,
  RepoMeta,
  ActivitySignals,
} from '../types';

/**
 * Normalize raw GitHub API data into a structured ArtifactBundle.
 */
export function normalizeArtifacts(
  rawData: RawArtifactData,
  repoUrl: string,
  candidateGithub?: string
): ArtifactBundle {
  const repoMeta = normalizeRepoMeta(rawData);
  const commits = normalizeCommits(rawData.commits);
  const pullRequests = normalizePRs(rawData.pullRequests);
  const issues = normalizeIssues(rawData.issues, pullRequests);
  const activitySignals = computeActivitySignals(commits, pullRequests, rawData);

  return {
    id: generateBundleId(repoUrl),
    candidateGithub: candidateGithub ?? extractGithubUser(rawData),
    repoUrl,
    extractedAt: new Date().toISOString(),
    repoMeta,
    commits,
    pullRequests,
    issues,
    activitySignals,
  };
}

// ------------------------------------------------------------------
// Repo Metadata
// ------------------------------------------------------------------

function normalizeRepoMeta(rawData: RawArtifactData): RepoMeta {
  const { repoInfo, languages } = rawData;

  // Convert language bytes to percentages
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  const languagePercentages: Record<string, number> = {};
  for (const [lang, bytes] of Object.entries(languages)) {
    languagePercentages[lang] = totalBytes > 0
      ? Math.round((bytes / totalBytes) * 1000) / 10
      : 0;
  }

  return {
    name: repoInfo.name,
    fullName: repoInfo.full_name,
    description: repoInfo.description ?? '',
    languages: languagePercentages,
    stars: repoInfo.stargazers_count,
    forks: repoInfo.forks_count,
    defaultBranch: repoInfo.default_branch,
    createdAt: repoInfo.created_at,
    updatedAt: repoInfo.updated_at,
  };
}

// ------------------------------------------------------------------
// Commits
// ------------------------------------------------------------------

function normalizeCommits(rawCommits: RawCommit[]): NormalizedCommit[] {
  return rawCommits
    .filter((c) => !isTrivialCommit(c))
    .map((c) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0].trim(), // first line only
      author: c.author?.login ?? c.commit.author.name,
      date: c.commit.author.date,
      additions: c.stats?.additions ?? 0,
      deletions: c.stats?.deletions ?? 0,
      filesChanged: c.files?.length ?? 0,
      languages: extractLanguagesFromFiles(c.files ?? []),
    }));
}

/**
 * Filter out trivial commits:
 *  - Merge commits (message starts with "Merge")
 *  - Bot commits (author contains [bot])
 *  - Empty commits (no file changes and no stats)
 */
function isTrivialCommit(commit: RawCommit): boolean {
  const msg = commit.commit.message.toLowerCase();

  // Merge commits
  if (msg.startsWith('merge ')) return true;

  // Bot commits
  const author = commit.author?.login ?? commit.commit.author.name;
  if (author.includes('[bot]') || author.includes('dependabot') || author.includes('renovate')) {
    return true;
  }

  // Auto-generated commits
  if (msg.startsWith('auto-') || msg.startsWith('chore(deps)')) return true;

  return false;
}

/**
 * Extract programming languages from file extensions.
 */
function extractLanguagesFromFiles(files: { filename: string }[]): string[] {
  const extToLang: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.rs': 'Rust', '.go': 'Go', '.java': 'Java', '.rb': 'Ruby',
    '.cpp': 'C++', '.c': 'C', '.cs': 'C#', '.swift': 'Swift', '.kt': 'Kotlin',
    '.sol': 'Solidity', '.vue': 'Vue', '.svelte': 'Svelte', '.php': 'PHP',
    '.css': 'CSS', '.scss': 'SCSS', '.html': 'HTML', '.sql': 'SQL',
    '.sh': 'Shell', '.yml': 'YAML', '.yaml': 'YAML', '.json': 'JSON',
    '.md': 'Markdown', '.toml': 'TOML', '.dockerfile': 'Docker',
  };

  const langs = new Set<string>();
  for (const file of files) {
    const ext = '.' + file.filename.split('.').pop()?.toLowerCase();
    if (ext && extToLang[ext]) {
      langs.add(extToLang[ext]);
    }
  }
  return Array.from(langs);
}

// ------------------------------------------------------------------
// Pull Requests
// ------------------------------------------------------------------

function normalizePRs(rawPRs: RawPullRequest[]): NormalizedPR[] {
  return rawPRs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    description: truncateText(pr.body ?? '', 500),
    author: pr.user.login,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at,
    state: pr.state,
    additions: pr.additions,
    deletions: pr.deletions,
    filesChanged: pr.changed_files,
    reviewComments: pr.review_comments,
    labels: pr.labels.map((l) => l.name),
  }));
}

// ------------------------------------------------------------------
// Issues
// ------------------------------------------------------------------

function normalizeIssues(
  rawIssues: RawIssue[],
  normalizedPRs: NormalizedPR[]
): NormalizedIssue[] {
  const prNumbers = new Set(normalizedPRs.map((pr) => pr.number));

  return rawIssues.map((issue) => {
    // Try to find linked PRs by looking for "#<number>" references in body
    const linkedPRNumbers = findLinkedPRNumbers(issue.body ?? '', prNumbers);

    return {
      number: issue.number,
      title: issue.title,
      description: truncateText(issue.body ?? '', 300),
      author: issue.user.login,
      createdAt: issue.created_at,
      closedAt: issue.closed_at,
      state: issue.state,
      labels: issue.labels.map((l) => l.name),
      linkedPRNumbers,
    };
  });
}

function findLinkedPRNumbers(text: string, knownPRs: Set<number>): number[] {
  const linked: number[] = [];
  const matches = text.matchAll(/#(\d+)/g);
  for (const match of matches) {
    const num = parseInt(match[1], 10);
    if (knownPRs.has(num)) {
      linked.push(num);
    }
  }
  return linked;
}

// ------------------------------------------------------------------
// Activity Signals
// ------------------------------------------------------------------

function computeActivitySignals(
  commits: NormalizedCommit[],
  pullRequests: NormalizedPR[],
  rawData: RawArtifactData
): ActivitySignals {
  // Commit frequency: commits per week
  const commitDates = commits.map((c) => new Date(c.date).getTime()).sort();
  let commitFrequency = 0;
  if (commitDates.length >= 2) {
    const spanMs = commitDates[commitDates.length - 1] - commitDates[0];
    const spanWeeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
    commitFrequency = Math.round((commits.length / spanWeeks) * 10) / 10;
  }

  // Average PR size
  const prSizes = pullRequests
    .filter((pr) => pr.additions + pr.deletions > 0)
    .map((pr) => pr.additions + pr.deletions);
  const avgPRSize = prSizes.length > 0
    ? Math.round(prSizes.reduce((a, b) => a + b, 0) / prSizes.length)
    : 0;

  // Average commit size
  const commitSizes = commits
    .filter((c) => c.additions + c.deletions > 0)
    .map((c) => c.additions + c.deletions);
  const avgCommitSize = commitSizes.length > 0
    ? Math.round(commitSizes.reduce((a, b) => a + b, 0) / commitSizes.length)
    : 0;

  // PR merge rate
  const mergedPRs = pullRequests.filter((pr) => pr.mergedAt !== null).length;
  const prMergeRate = pullRequests.length > 0
    ? Math.round((mergedPRs / pullRequests.length) * 100) / 100
    : 0;

  // Review participation
  const totalReviewComments = pullRequests.reduce((sum, pr) => sum + pr.reviewComments, 0);
  const reviewParticipation = pullRequests.length > 0
    ? Math.round((totalReviewComments / pullRequests.length) * 10) / 10
    : 0;

  // Language distribution (from repo-level data)
  const totalBytes = Object.values(rawData.languages).reduce((a, b) => a + b, 0);
  const languageDistribution: Record<string, number> = {};
  for (const [lang, bytes] of Object.entries(rawData.languages)) {
    languageDistribution[lang] = totalBytes > 0
      ? Math.round((bytes / totalBytes) * 1000) / 10
      : 0;
  }

  // Active days
  const uniqueDays = new Set(
    commits.map((c) => new Date(c.date).toISOString().split('T')[0])
  );

  return {
    commitFrequency,
    avgPRSize,
    avgCommitSize,
    prMergeRate,
    reviewParticipation,
    languageDistribution,
    activeDays: uniqueDays.size,
  };
}

// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------

function generateBundleId(repoUrl: string): string {
  const timestamp = Date.now().toString(36);
  const urlHash = simpleHash(repoUrl).toString(36);
  return `artifact_${urlHash}_${timestamp}`;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function extractGithubUser(rawData: RawArtifactData): string {
  // Try to get from the most recent commit author
  if (rawData.commits.length > 0) {
    return rawData.commits[0].author?.login ?? rawData.commits[0].commit.author.name;
  }
  return rawData.repoInfo.full_name.split('/')[0];
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
