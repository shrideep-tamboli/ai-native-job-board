// ============================================================
// GitHub REST API Client (wraps Octokit)
// ============================================================

import { Octokit } from 'octokit';
import {
  RawCommit,
  RawPullRequest,
  RawIssue,
  RawRepoInfo,
  RawLanguages,
  RawFileChange,
} from './types';
import { ScreenerError, ScreenerErrorCode } from '../types';

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Get repository metadata.
   */
  async getRepoInfo(owner: string, repo: string): Promise<RawRepoInfo> {
    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });
      return {
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        default_branch: data.default_branch,
        created_at: data.created_at,
        updated_at: data.updated_at,
        language: data.language,
      };
    } catch (error) {
      throw this.handleError(error, owner, repo);
    }
  }

  /**
   * Get repository language breakdown (bytes per language).
   */
  async getLanguages(owner: string, repo: string): Promise<RawLanguages> {
    try {
      const { data } = await this.octokit.rest.repos.listLanguages({ owner, repo });
      return data;
    } catch (error) {
      throw this.handleError(error, owner, repo);
    }
  }

  /**
   * Get commits with pagination.
   */
  async getCommits(
    owner: string,
    repo: string,
    options: { maxCommits?: number; since?: string } = {}
  ): Promise<RawCommit[]> {
    const { maxCommits = 50, since } = options;

    try {
      const commits: RawCommit[] = [];
      const perPage = Math.min(maxCommits, 100);

      const iterator = this.octokit.paginate.iterator(
        this.octokit.rest.repos.listCommits,
        {
          owner,
          repo,
          per_page: perPage,
          ...(since ? { since } : {}),
        }
      );

      for await (const { data: pageCommits } of iterator) {
        for (const commit of pageCommits) {
          commits.push({
            sha: commit.sha,
            commit: {
              message: commit.commit.message,
              author: {
                name: commit.commit.author?.name ?? 'Unknown',
                email: commit.commit.author?.email ?? '',
                date: commit.commit.author?.date ?? '',
              },
            },
            author: commit.author ? { login: commit.author.login } : null,
            stats: undefined, // fetched separately if needed
            files: undefined,
          });

          if (commits.length >= maxCommits) break;
        }
        if (commits.length >= maxCommits) break;
      }

      return commits;
    } catch (error) {
      throw this.handleError(error, owner, repo);
    }
  }

  /**
   * Get detailed commit info (stats + file changes) for a single commit.
   */
  async getCommitDetail(
    owner: string,
    repo: string,
    sha: string
  ): Promise<{ stats: { additions: number; deletions: number; total: number }; files: RawFileChange[] }> {
    try {
      const { data } = await this.octokit.rest.repos.getCommit({ owner, repo, ref: sha });

      return {
        stats: {
          additions: data.stats?.additions ?? 0,
          deletions: data.stats?.deletions ?? 0,
          total: data.stats?.total ?? 0,
        },
        files: (data.files ?? []).map((f) => ({
          filename: f.filename,
          status: f.status ?? 'modified',
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
          patch: f.patch,
        })),
      };
    } catch (error) {
      throw this.handleError(error, owner, repo);
    }
  }

  /**
   * Get pull requests (default: closed/merged).
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options: { state?: 'open' | 'closed' | 'all'; maxPRs?: number } = {}
  ): Promise<RawPullRequest[]> {
    const { state = 'closed', maxPRs = 30 } = options;

    try {
      const prs: RawPullRequest[] = [];
      const perPage = Math.min(maxPRs, 100);

      const iterator = this.octokit.paginate.iterator(
        this.octokit.rest.pulls.list,
        {
          owner,
          repo,
          state,
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
        }
      );

      for await (const { data: pagePRs } of iterator) {
        for (const pr of pagePRs) {
          prs.push({
            number: pr.number,
            title: pr.title,
            body: pr.body,
            user: { login: pr.user?.login ?? 'Unknown' },
            state: pr.state,
            created_at: pr.created_at,
            merged_at: pr.merged_at,
            additions: 0,   // not available in list, enriched later if needed
            deletions: 0,
            changed_files: 0,
            review_comments: 0,
            labels: (pr.labels ?? []).map((l) =>
              typeof l === 'string' ? { name: l } : { name: l.name ?? '' }
            ),
          });

          if (prs.length >= maxPRs) break;
        }
        if (prs.length >= maxPRs) break;
      }

      return prs;
    } catch (error) {
      throw this.handleError(error, owner, repo);
    }
  }

  /**
   * Get a single PR with full details (additions, deletions, review_comments).
   */
  async getPullRequestDetail(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<RawPullRequest> {
    try {
      const { data: pr } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        user: { login: pr.user?.login ?? 'Unknown' },
        state: pr.state,
        created_at: pr.created_at,
        merged_at: pr.merged_at,
        additions: pr.additions,
        deletions: pr.deletions,
        changed_files: pr.changed_files,
        review_comments: pr.review_comments,
        labels: (pr.labels ?? []).map((l) =>
          typeof l === 'string' ? { name: l } : { name: l.name ?? '' }
        ),
      };
    } catch (error) {
      throw this.handleError(error, owner, repo);
    }
  }

  /**
   * Get issues (excluding pull requests).
   */
  async getIssues(
    owner: string,
    repo: string,
    options: { state?: 'open' | 'closed' | 'all'; maxIssues?: number } = {}
  ): Promise<RawIssue[]> {
    const { state = 'closed', maxIssues = 30 } = options;

    try {
      const issues: RawIssue[] = [];
      const perPage = Math.min(maxIssues, 100);

      const iterator = this.octokit.paginate.iterator(
        this.octokit.rest.issues.listForRepo,
        {
          owner,
          repo,
          state,
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
        }
      );

      for await (const { data: pageIssues } of iterator) {
        for (const issue of pageIssues) {
          // Skip pull requests (GitHub API returns them as issues too)
          if (issue.pull_request) continue;

          issues.push({
            number: issue.number,
            title: issue.title,
            body: issue.body,
            user: { login: issue.user?.login ?? 'Unknown' },
            state: issue.state,
            created_at: issue.created_at,
            closed_at: issue.closed_at ?? null,
            labels: (issue.labels ?? []).map((l) =>
              typeof l === 'string' ? { name: l } : { name: (l as { name?: string }).name ?? '' }
            ),
            pull_request: undefined,
          });

          if (issues.length >= maxIssues) break;
        }
        if (issues.length >= maxIssues) break;
      }

      return issues;
    } catch (error) {
      throw this.handleError(error, owner, repo);
    }
  }

  // ------------------------------------------------------------------
  // Error Handling
  // ------------------------------------------------------------------

  private handleError(error: unknown, owner: string, repo: string): ScreenerError {
    const err = error as { status?: number; message?: string };

    if (err.status === 401 || err.status === 403) {
      return new ScreenerError(
        `GitHub authentication failed for ${owner}/${repo}. Check your token.`,
        ScreenerErrorCode.GITHUB_AUTH_FAILED,
        err
      );
    }

    if (err.status === 404) {
      return new ScreenerError(
        `Repository ${owner}/${repo} not found or not accessible.`,
        ScreenerErrorCode.GITHUB_REPO_NOT_FOUND,
        err
      );
    }

    if (err.status === 429) {
      return new ScreenerError(
        `GitHub API rate limit exceeded.`,
        ScreenerErrorCode.GITHUB_RATE_LIMITED,
        err
      );
    }

    return new ScreenerError(
      `GitHub API error: ${err.message ?? 'Unknown error'}`,
      ScreenerErrorCode.GITHUB_API_ERROR,
      err
    );
  }
}
