'use client';

import { useState, useEffect } from 'react';
import { jobService, applicationService, Job } from '@/lib/database';

const GITHUB_TOKEN_KEY = 'github_token';

interface RepoItem {
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
}

function isValidRepoUrl(url: string): boolean {
  try {
    const trimmed = url.trim();
    return trimmed.length > 0 && (trimmed.includes('github.com') || /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed));
  } catch {
    return false;
  }
}

export default function CandidateFeedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [userRepos, setUserRepos] = useState<RepoItem[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [useManualUrl, setUseManualUrl] = useState(false);

  // Capture GitHub token from OAuth callback URL and store in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('github_token');
    if (token) {
      sessionStorage.setItem(GITHUB_TOKEN_KEY, token);
      setGithubConnected(true);
      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('github_token');
      window.history.replaceState({}, '', url.pathname + url.search);
    } else {
      // Check if already connected from a previous session
      const existing = sessionStorage.getItem(GITHUB_TOKEN_KEY);
      if (existing) setGithubConnected(true);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, []);

  // Fetch user's repos when application form opens and GitHub is connected
  useEffect(() => {
    if (!showApplicationForm || !githubConnected) return;
    const token = sessionStorage.getItem(GITHUB_TOKEN_KEY);
    if (!token) return;

    setReposLoading(true);
    setReposError(null);
    fetch('/api/github/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.repos) setUserRepos(data.repos);
        else setReposError(data.error ?? 'Failed to load repositories.');
      })
      .catch(() => setReposError('Failed to load repositories.'))
      .finally(() => setReposLoading(false));
  }, [showApplicationForm, githubConnected]);

  const loadJobs = async () => {
    try {
      const allJobs = await jobService.getAllJobs();
      setJobs(allJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleApplyClick = async (job: Job) => {
    try {
      const hasAlreadyApplied = await applicationService.hasApplied(job.id);
      if (hasAlreadyApplied) {
        alert('You have already applied for this job!');
        return;
      }
      setSelectedJob(job);
      setShowApplicationForm(true);
      setApplicationMessage('');
      setRepoUrl('');
      setExtractError(null);
      setUseManualUrl(false);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob || !applicationMessage.trim()) return;
    if (!repoUrl.trim()) {
      setExtractError(githubConnected ? 'Please select a repository or enter a URL.' : 'Please enter your GitHub repository URL.');
      return;
    }
    if (!isValidRepoUrl(repoUrl)) {
      setExtractError('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo).');
      return;
    }

    const token = typeof window !== 'undefined' ? sessionStorage.getItem(GITHUB_TOKEN_KEY) : null;
    if (!token) {
      setExtractError('Please connect your GitHub account first.');
      return;
    }

    setExtractError(null);
    setExtractLoading(true);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/d9416256-93db-4597-bb06-cd9a2ae75bef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'candidate/feed/page.tsx:handleSubmitApplication',message:'try started',data:{jobId:selectedJob?.id,repoUrlLen:repoUrl.trim().length},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const res = await fetch('/api/screener/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), token }),
      });
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/d9416256-93db-4597-bb06-cd9a2ae75bef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'candidate/feed/page.tsx:after fetch',message:'extract response',data:{ok:res.ok,status:res.status},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      const json = await res.json();

      if (!res.ok) {
        setExtractError(json.error ?? 'Failed to analyze repository. Check the URL and try again.');
        setExtractLoading(false);
        return;
      }

      const artifactBundle = json.data;
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/d9416256-93db-4597-bb06-cd9a2ae75bef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'candidate/feed/page.tsx:before createApplication',message:'payload check',data:{hasData:!!json.data,jobId:selectedJob?.id},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      await applicationService.createApplication({
        job_id: selectedJob.id,
        candidate_message: applicationMessage,
        status: 'pending',
        repo_url: repoUrl.trim(),
        artifact_data: artifactBundle as Record<string, unknown>,
      });

      setShowToast(true);
      setShowApplicationForm(false);
      setApplicationMessage('');
      setRepoUrl('');
      setSelectedJob(null);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      // #region agent log
      const err = error as { message?: string; code?: string; details?: string };
      fetch('http://127.0.0.1:7245/ingest/d9416256-93db-4597-bb06-cd9a2ae75bef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'candidate/feed/page.tsx:catch',message:'submit error',data:{name:(error as Error)?.constructor?.name,message:err?.message,code:err?.code,details:err?.details,str:JSON.stringify(error)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      console.error('Error submitting application:', error);
      const message = err?.message ?? 'Error submitting application. Please try again.';
      setExtractError(message);
    } finally {
      setExtractLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Available Jobs
          </h1>
          <button
            onClick={() => (window.location.href = '/candidate/past-applications')}
            className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            My Applications
          </button>
        </div>

        {/* Job list */}
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">No jobs available at the moment.</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    {job.title}
                  </h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>{job.company}</span>
                    <span>{job.location}</span>
                    <span className="capitalize">{job.type}</span>
                    {job.salary && <span>{job.salary}</span>}
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Requirements</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {job.requirements}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyClick(job)}
                  className="w-full py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Apply for this Job
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Apply for {selectedJob.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              {selectedJob.company} &middot; {selectedJob.location}
            </p>

            {/* GitHub connection status */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  GitHub Account
                </label>
                {githubConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : (
                  <a
                    href="/api/auth/github?returnTo=/candidate/feed"
                    className="text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    Connect GitHub
                  </a>
                )}
              </div>
            </div>

            {/* Repository: pick from profile or enter URL */}
            <div className="mb-5">
              <label htmlFor="repoUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Repository
              </label>
              {githubConnected && !useManualUrl ? (
                <>
                  {reposLoading ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">Loading your repositories...</p>
                  ) : reposError ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1.5">{reposError}</p>
                  ) : (
                    <select
                      id="repoSelect"
                      value={repoUrl}
                      onChange={(e) => { setRepoUrl(e.target.value); setExtractError(null); }}
                      className="w-full px-3.5 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    >
                      <option value="">Select a repository</option>
                      {userRepos.map((repo) => (
                        <option key={repo.full_name} value={repo.html_url}>
                          {repo.full_name}
                          {repo.private ? ' (private)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => { setUseManualUrl(true); setRepoUrl(''); setExtractError(null); }}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors"
                    >
                      Enter URL manually
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <input
                    id="repoUrl"
                    type="url"
                    value={repoUrl}
                    onChange={(e) => { setRepoUrl(e.target.value); setExtractError(null); }}
                    placeholder="https://github.com/username/repo or owner/repo"
                    className="w-full px-3.5 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  />
                  {githubConnected && (
                    <p className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => { setUseManualUrl(false); setRepoUrl(''); setExtractError(null); }}
                        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors"
                      >
                        Pick from my repositories
                      </button>
                    </p>
                  )}
                  {!githubConnected && (
                    <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      Connect GitHub above to access private repositories.
                    </p>
                  )}
                </>
              )}
              {extractError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{extractError}</p>
              )}
            </div>

            {/* Message */}
            <div className="mb-6">
              <label htmlFor="applicationMessage" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Why are you interested in this position?
              </label>
              <textarea
                id="applicationMessage"
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Tell us why you're a good fit for this role..."
                rows={5}
                className="w-full px-3.5 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitApplication}
                disabled={!applicationMessage.trim() || !repoUrl.trim() || extractLoading}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {extractLoading ? 'Analyzing repository...' : 'Submit Application'}
              </button>
              <button
                onClick={() => {
                  setShowApplicationForm(false);
                  setSelectedJob(null);
                  setApplicationMessage('');
                  setRepoUrl('');
                  setExtractError(null);
                }}
                disabled={extractLoading}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-3 rounded-lg text-sm font-medium shadow-lg z-50">
          Application submitted successfully
        </div>
      )}
    </div>
  );
}
