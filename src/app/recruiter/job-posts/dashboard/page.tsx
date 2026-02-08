'use client';

import { useState, useEffect } from 'react';
import { jobService, applicationService, Job, Application } from '@/lib/database';
import ScoreCard, { type EvaluationDisplay } from '@/components/ScoreCard';

function ApplicationCard({
  application,
  index,
  onUpdateStatus,
}: {
  application: Application;
  index: number;
  job: Job;
  onUpdateStatus: (id: string, status: 'pending' | 'accepted' | 'rejected') => Promise<void>;
}) {
  const evaluation = application.evaluation_data as EvaluationDisplay | null | undefined;
  const hasEvaluation = application.evaluation_data != null && application.evaluation_status === 'completed';

  const statusStyle = (s: string) => {
    if (s === 'accepted') return 'text-zinc-900 dark:text-zinc-100';
    if (s === 'rejected') return 'text-zinc-400 dark:text-zinc-500';
    return 'text-zinc-500 dark:text-zinc-400';
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Application #{index + 1}
            </h4>
            {application.overall_score != null && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Score: {application.overall_score}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
            <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
            <span className={`capitalize font-medium ${statusStyle(application.status)}`}>
              {application.status}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdateStatus(application.id, 'accepted')}
                className="px-2.5 py-1 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onUpdateStatus(application.id, 'rejected')}
                className="px-2.5 py-1 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {application.candidate_message && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Message</h5>
          <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap line-clamp-3 leading-relaxed">
              {application.candidate_message}
            </p>
          </div>
        </div>
      )}

      <div className="mb-2">
        <h5 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">AI Evaluation</h5>
        <ScoreCard
          evaluation={hasEvaluation && evaluation ? evaluation : null}
          repoUrl={application.repo_url ?? undefined}
        />
      </div>

      <div className="text-xs text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        ID: {application.candidate_id}
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [evaluateLoading, setEvaluateLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const jobId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('jobId') : null;

  useEffect(() => {
    if (jobId) loadJobAndApplications(jobId);
  }, [jobId]);

  const loadJobAndApplications = async (id: string) => {
    try {
      const jobData = await jobService.getJobById(id);
      setJob(jobData);
      const applicationsData = await applicationService.getApplicationsByJobId(id);
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Error loading job and applications:', error);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      if (job) {
        const updated = await applicationService.getApplicationsByJobId(job.id);
        setApplications(updated);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleEvaluateAll = async () => {
    if (!job) return;
    const toEvaluate = applications.filter(
      (app) => app.artifact_data != null && app.evaluation_status !== 'completed'
    );
    if (toEvaluate.length === 0) return;
    setEvaluateLoading(true);
    const jobDescription = {
      id: job.id,
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
    };
    for (const app of toEvaluate) {
      try {
        await applicationService.setApplicationEvaluationProcessing(app.id);
        const res = await fetch('/api/screener/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artifactBundle: app.artifact_data, jobDescription }),
        });
        const json = await res.json();
        if (res.ok && json.data) {
          await applicationService.updateApplicationEvaluation(
            app.id,
            json.data as Record<string, unknown>,
            json.data.overallScore ?? 0
          );
        }
      } catch (err) {
        console.error('Evaluate failed for application', app.id, err);
      }
    }
    const updated = await applicationService.getApplicationsByJobId(job.id);
    setApplications(updated);
    setEvaluateLoading(false);
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">Job not found.</p>
          <button
            onClick={() => (window.location.href = '/recruiter/job-posts')}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Back to Job Posts
          </button>
        </div>
      </div>
    );
  }

  const unevaluatedCount = applications.filter(
    (app) => app.artifact_data != null && app.evaluation_status !== 'completed'
  ).length;

  const filteredApplications =
    statusFilter === 'all' ? applications : applications.filter((app) => app.status === statusFilter);

  const evaluatedApps = filteredApplications.filter(
    (app) => app.evaluation_data != null && app.evaluation_status === 'completed'
  );
  const pendingEvaluationApps = filteredApplications.filter(
    (app) => app.artifact_data == null || app.evaluation_status !== 'completed'
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {job.title}
          </h1>
          <button
            onClick={() => (window.location.href = '/recruiter/job-posts')}
            className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Back to Jobs
          </button>
        </div>

        {/* Job summary */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-sm">
            <div>
              <span className="text-zinc-400 dark:text-zinc-500">Company</span>
              <p className="text-zinc-700 dark:text-zinc-300">{job.company}</p>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500">Location</span>
              <p className="text-zinc-700 dark:text-zinc-300">{job.location}</p>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500">Type</span>
              <p className="text-zinc-700 dark:text-zinc-300 capitalize">{job.type}</p>
            </div>
            {job.salary && (
              <div>
                <span className="text-zinc-400 dark:text-zinc-500">Salary</span>
                <p className="text-zinc-700 dark:text-zinc-300">{job.salary}</p>
              </div>
            )}
            <div>
              <span className="text-zinc-400 dark:text-zinc-500">Posted</span>
              <p className="text-zinc-700 dark:text-zinc-300">{new Date(job.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500">Applications</span>
              <p className="text-zinc-700 dark:text-zinc-300">{applications.length}</p>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 dark:text-zinc-400">No applications received yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Leaderboard
                <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500 ml-2">
                  ({applications.length})
                </span>
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              {unevaluatedCount > 0 && (
                <button
                  onClick={handleEvaluateAll}
                  disabled={evaluateLoading}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {evaluateLoading ? 'Evaluating...' : `Evaluate All (${unevaluatedCount})`}
                </button>
              )}
            </div>

            {/* Evaluated */}
            {evaluatedApps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  Evaluated (by score)
                </h3>
                <div className="space-y-3">
                  {evaluatedApps.map((application, index) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      index={index}
                      job={job}
                      onUpdateStatus={handleUpdateApplicationStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending evaluation */}
            {pendingEvaluationApps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 dark:text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  Pending Evaluation ({pendingEvaluationApps.length})
                </h3>
                <div className="space-y-3">
                  {pendingEvaluationApps.map((application, index) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      index={evaluatedApps.length + index}
                      job={job}
                      onUpdateStatus={handleUpdateApplicationStatus}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
