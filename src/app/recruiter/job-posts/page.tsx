'use client';

import { useState, useEffect } from 'react';
import { jobService, Job } from '@/lib/database';

export default function JobPostsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const myJobs = await jobService.getMyJobs();
      setJobs(myJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await jobService.deleteJob(jobId);
      await loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleViewApplications = (jobId: string) => {
    window.location.href = `/recruiter/job-posts/dashboard?jobId=${jobId}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Posted Jobs
          </h1>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Post Another Job
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">No jobs posted yet.</p>
            <a
              href="/"
              className="inline-flex px-5 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Post Your First Job
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2
                      className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2 cursor-pointer hover:underline underline-offset-2 transition-colors"
                      onClick={() => handleViewApplications(job.id)}
                    >
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
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleViewApplications(job.id)}
                      className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      Applications
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
