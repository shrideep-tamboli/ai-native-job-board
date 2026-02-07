// ============================================================
// Shared Types for the Screener Pipeline
// ============================================================

// ---- Normalized Artifact Types ----

export interface NormalizedCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  languages: string[];
}

export interface NormalizedPR {
  number: number;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  mergedAt: string | null;
  state: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  reviewComments: number;
  labels: string[];
}

export interface NormalizedIssue {
  number: number;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  closedAt: string | null;
  state: string;
  labels: string[];
  linkedPRNumbers: number[];
}

export interface RepoMeta {
  name: string;
  fullName: string;
  description: string;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySignals {
  commitFrequency: number;       // commits per week (over the extracted window)
  avgPRSize: number;             // average additions+deletions per PR
  avgCommitSize: number;         // average additions+deletions per commit
  prMergeRate: number;           // fraction of PRs that were merged
  reviewParticipation: number;   // average review comments per PR
  languageDistribution: Record<string, number>; // language -> percentage (0-100)
  activeDays: number;            // unique days with commits
}

export interface ArtifactBundle {
  id: string;
  candidateGithub: string;
  repoUrl: string;
  extractedAt: string;
  repoMeta: RepoMeta;
  commits: NormalizedCommit[];
  pullRequests: NormalizedPR[];
  issues: NormalizedIssue[];
  activitySignals: ActivitySignals;
}

// ---- Job Description Types ----

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  dailyTasks?: string;
  expectedOutcomes?: string;
  techStack?: string[];
  experienceLevel?: string;
}

// ---- Evaluation Types ----

export type ScoreCategory =
  | 'skills_alignment'
  | 'code_quality'
  | 'experience_relevance'
  | 'work_style';

export interface ComponentScore {
  category: ScoreCategory;
  score: number;         // 0-100
  reasoning: string;
}

export interface EvaluationResult {
  id: string;
  artifactBundleId: string;
  jobId: string;
  overallScore: number;          // 0-100
  componentScores: ComponentScore[];
  explanation: string;
  flaggedConcerns: string[];
  evaluatedAt: string;
  confidence: 'high' | 'medium' | 'low';
}

// ---- Pipeline Types ----

export interface ExtractOptions {
  maxCommits?: number;     // default 50
  sinceDays?: number;      // default 90
  includeIssues?: boolean; // default true
  includePRs?: boolean;    // default true
}

export interface PipelineResult {
  artifactBundle: ArtifactBundle;
  evaluation: EvaluationResult;
}

// ---- Error Types ----

export class ScreenerError extends Error {
  constructor(
    message: string,
    public readonly code: ScreenerErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ScreenerError';
  }
}

export enum ScreenerErrorCode {
  GITHUB_AUTH_FAILED = 'GITHUB_AUTH_FAILED',
  GITHUB_REPO_NOT_FOUND = 'GITHUB_REPO_NOT_FOUND',
  GITHUB_RATE_LIMITED = 'GITHUB_RATE_LIMITED',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  INVALID_REPO_URL = 'INVALID_REPO_URL',
  GEMINI_API_ERROR = 'GEMINI_API_ERROR',
  GEMINI_RATE_LIMITED = 'GEMINI_RATE_LIMITED',
  EVALUATION_PARSE_ERROR = 'EVALUATION_PARSE_ERROR',
  PIPELINE_ERROR = 'PIPELINE_ERROR',
}
