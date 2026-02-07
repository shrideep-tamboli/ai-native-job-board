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

interface Application {
  id: string;
  jobId: string;
  appliedAt: string;
  status: string;
}

export default function PastApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Retrieve applications from session storage
    const storedApplications = sessionStorage.getItem('jobApplications');
    if (storedApplications) {
      setApplications(JSON.parse(storedApplications));
    }
    
    // Retrieve jobs from session storage
    const storedJobs = sessionStorage.getItem('postedJobs');
    if (storedJobs) {
      setJobs(JSON.parse(storedJobs));
    }
  }, []);

  const handleWithdrawApplication = (applicationId: string) => {
    const updatedApplications = applications.filter(app => app.id !== applicationId);
    setApplications(updatedApplications);
    sessionStorage.setItem('jobApplications', JSON.stringify(updatedApplications));
    alert('Application withdrawn successfully!');
  };

  const getJobDetails = (jobId: string) => {
    return jobs.find(job => job.id === jobId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">My Applications</h1>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
        
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              You haven't applied to any jobs yet.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Available Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => {
              const job = getJobDetails(application.jobId);
              if (!job) return null;
              
              return (
                <div
                  key={application.id}
                  className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
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
                      <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                        <span>
                          <strong>Applied on:</strong> {new Date(application.appliedAt).toLocaleDateString()}
                        </span>
                        <span>
                          <strong>Status:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                            application.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : application.status === 'accepted'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {application.status}
                          </span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleWithdrawApplication(application.id)}
                      className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-black dark:text-zinc-50 mb-2">Job Description</h3>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}