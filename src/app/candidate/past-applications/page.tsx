'use client';

import { useState, useEffect } from 'react';
import { applicationService, jobService, Application, Job } from '@/lib/database';

export default function PastApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const userApplications = await applicationService.getMyApplications();
      setApplications(userApplications);

      const jobIds = userApplications.map((app) => app.job_id);
      const uniqueJobIds = [...new Set(jobIds)];
      const jobDetails = await Promise.all(
        uniqueJobIds.map((jobId) => jobService.getJobById(jobId))
      );
      setJobs(jobDetails.filter(Boolean));
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      await applicationService.deleteApplication(applicationId);
      await loadApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  const getJobDetails = (jobId: string) => jobs.find((job) => job.id === jobId);

  const statusStyle = (status: string) => {
    if (status === 'accepted') return 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900';
    if (status === 'rejected') return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400';
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            My Applications
          </h1>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Back to Jobs
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">You haven&apos;t applied to any jobs yet.</p>
            <button
              onClick={() => (window.location.href = '/')}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const job = getJobDetails(application.job_id);
              if (!job) return null;

              return (
                <div
                  key={application.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                        {job.title}
                      </h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>{job.company}</span>
                        <span>{job.location}</span>
                        <span className="capitalize">{job.type}</span>
                        {job.salary && <span>{job.salary}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${statusStyle(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleWithdrawApplication(application.id)}
                      className="ml-4 px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>

                  <div className="space-y-3">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
