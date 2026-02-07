// ============================================================
// High-Level GitHub Data Fetcher
// Orchestrates all GitHub API calls for a repository.
// ============================================================

import { GitHubClient } from './client';
import { RawArtifactData, FetchOptions } from './types';
import { ScreenerError, ScreenerErrorCode } from '../types';

/**
 * Parse a GitHub repository URL into owner and repo.
 * Accepts formats:
 *  - https://github.com/owner/repo
 *  - https://github.com/owner/repo.git
 *  - github.com/owner/repo
 *  - owner/repo
 */
export function parseRepoUrl(url: string): { owner: string; repo: string } {
  // Strip trailing slashes and .git
  const cleaned = url.trim().replace(/\/+$/, '').replace(/\.git$/, '');

  // Check if it looks like a URL (has protocol or known domain)
  const looksLikeUrl = cleaned.startsWith('http://') ||
    cleaned.startsWith('https://') ||
    cleaned.startsWith('github.com');

  if (looksLikeUrl) {
    try {
      const parsed = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
      // URL with < 2 path segments is invalid
      throw new ScreenerError(
        `Invalid GitHub repository URL: ${url}`,
        ScreenerErrorCode.INVALID_REPO_URL
      );
    } catch (e) {
      if (e instanceof ScreenerError) throw e;
      // Fall through to simple split
    }
  }

  // Try simple owner/repo format
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new ScreenerError(
    `Invalid GitHub repository URL: ${url}`,
    ScreenerErrorCode.INVALID_REPO_URL
  );
}

/**
 * Fetch all raw artifact data from a GitHub repository.
 */
export async function fetchRepoArtifacts(
  token: string,
  repoUrl: string,
  options: FetchOptions = {}
): Promise<RawArtifactData> {
  const {
    maxCommits = 50,
    sinceDays = 90,
    includeIssues = true,
    includePRs = true,
  } = options;

  const { owner, repo } = parseRepoUrl(repoUrl);
  const client = new GitHubClient(token);

  // Calculate 'since' date
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDays);
  const since = sinceDate.toISOString();

  // Fetch repo info + languages + commits in parallel
  const [repoInfo, languages, commits] = await Promise.all([
    client.getRepoInfo(owner, repo),
    client.getLanguages(owner, repo),
    client.getCommits(owner, repo, { maxCommits, since }),
  ]);

  // Fetch PRs and issues in parallel (conditional)
  const [pullRequests, issues] = await Promise.all([
    includePRs
      ? client.getPullRequests(owner, repo, { state: 'all', maxPRs: 30 })
      : Promise.resolve([]),
    includeIssues
      ? client.getIssues(owner, repo, { state: 'all', maxIssues: 30 })
      : Promise.resolve([]),
  ]);

  // Enrich PRs with detail (additions, deletions, review_comments)
  // Limit to top 15 most recent to avoid rate limit issues
  const enrichedPRs = await Promise.all(
    pullRequests.slice(0, 15).map(async (pr) => {
      try {
        return await client.getPullRequestDetail(owner, repo, pr.number);
      } catch {
        // If enrichment fails, return the basic PR data
        return pr;
      }
    })
  );

  // Enrich top commits with detail (stats + files)
  // Limit to top 20 to avoid rate limit issues
  const enrichedCommits = await Promise.all(
    commits.slice(0, 20).map(async (commit) => {
      try {
        const detail = await client.getCommitDetail(owner, repo, commit.sha);
        return {
          ...commit,
          stats: detail.stats,
          files: detail.files,
        };
      } catch {
        return commit;
      }
    })
  );

  // Combine: enriched commits first, then remaining non-enriched
  const allCommits = [
    ...enrichedCommits,
    ...commits.slice(20),
  ];

  return {
    repoInfo,
    languages,
    commits: allCommits,
    pullRequests: [
      ...enrichedPRs,
      ...pullRequests.slice(15),
    ],
    issues,
  };
}
