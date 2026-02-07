// ============================================================
// Raw GitHub API Response Types
// ============================================================

export interface RawCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: RawFileChange[];
}

export interface RawFileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface RawPullRequest {
  number: number;
  title: string;
  body: string | null;
  user: {
    login: string;
  };
  state: string;
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  review_comments: number;
  labels: Array<{ name: string }>;
}

export interface RawIssue {
  number: number;
  title: string;
  body: string | null;
  user: {
    login: string;
  };
  state: string;
  created_at: string;
  closed_at: string | null;
  labels: Array<{ name: string }>;
  pull_request?: {
    url: string;
  };
}

export interface RawRepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  language: string | null;
}

export interface RawLanguages {
  [language: string]: number; // language -> bytes
}

export interface RawArtifactData {
  repoInfo: RawRepoInfo;
  languages: RawLanguages;
  commits: RawCommit[];
  pullRequests: RawPullRequest[];
  issues: RawIssue[];
}

export interface FetchOptions {
  maxCommits?: number;
  sinceDays?: number;
  includeIssues?: boolean;
  includePRs?: boolean;
}
