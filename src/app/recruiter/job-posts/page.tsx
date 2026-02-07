'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary: string;
  postedAt: string;
}

export default function JobPostsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Retrieve jobs from session storage
    const storedJobs = sessionStorage.getItem('postedJobs');
    if (storedJobs) {
      setJobs(JSON.parse(storedJobs));
    }
  }, []);

  const handleDeleteJob = (jobId: string) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    setJobs(updatedJobs);
    sessionStorage.setItem('postedJobs', JSON.stringify(updatedJobs));
  };

  const handleViewApplications = (jobId: string) => {
    window.location.href = `/recruiter/job-posts/dashboard?jobId=${jobId}`;
  };

  const handleNavigateToCreateJob = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-8">Posted Jobs</h1>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              No jobs posted yet.
            </p>
            <a
              href="/recruiter/create-job"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post Your First Job
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 
                      className="text-xl font-semibold text-black dark:text-zinc-50 mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => handleViewApplications(job.id)}
                    >
                      {job.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      <span className="flex items-center">
                        <strong>Company:</strong> {job.company}
                      </span>
                      <span className="flex items-center">
                        <strong>Location:</strong> {job.location}
                      </span>
                      <span className="flex items-center">
                        <strong>Type:</strong> {job.type}
                      </span>
                      {job.salary && (
                        <span className="flex items-center">
                          <strong>Salary:</strong> {job.salary}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                      Posted on {new Date(job.postedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewApplications(job.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      View Applications
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-black dark:text-zinc-50 mb-2">Description</h3>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-black dark:text-zinc-50 mb-2">Requirements</h3>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-8 text-center">
              <button
                onClick={handleNavigateToCreateJob}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post Another Job
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}