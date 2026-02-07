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
  candidateMessage: string;
}

export default function RecruiterDashboardPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    // Get job ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');
    
    if (jobId) {
      // Retrieve job from session storage
      const storedJobs = sessionStorage.getItem('postedJobs');
      const jobs = storedJobs ? JSON.parse(storedJobs) : [];
      const foundJob = jobs.find((j: Job) => j.id === jobId);
      
      if (foundJob) {
        setJob(foundJob);
        
        // Retrieve applications for this job
        const storedApplications = sessionStorage.getItem('jobApplications');
        const allApplications = storedApplications ? JSON.parse(storedApplications) : [];
        const jobApplications = allApplications.filter((app: Application) => app.jobId === jobId);
        setApplications(jobApplications);
      }
    }
  }, []);

  const handleUpdateApplicationStatus = (applicationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    const updatedApplications = applications.map(app =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    );
    setApplications(updatedApplications);
    
    // Update in session storage
    const storedApplications = sessionStorage.getItem('jobApplications');
    const allApplications = storedApplications ? JSON.parse(storedApplications) : [];
    const updatedAllApplications = allApplications.map((app: Application) =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    );
    sessionStorage.setItem('jobApplications', JSON.stringify(updatedAllApplications));
  };

  const handleBackToJobs = () => {
    window.location.href = '/recruiter/job-posts';
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              Job not found.
            </p>
            <button
              onClick={handleBackToJobs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Job Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Applications for {job.title}
          </h1>
          <button
            onClick={handleBackToJobs}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Job Posts
          </button>
        </div>

        {/* Job Details */}
        <div className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Company:</strong> {job.company}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Location:</strong> {job.location}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Type:</strong> {job.type}
              </p>
            </div>
            <div>
              {job.salary && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <strong>Salary:</strong> {job.salary}
                </p>
              )}
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Posted:</strong> {new Date(job.postedAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Total Applications:</strong> {applications.length}
              </p>
            </div>
          </div>
        </div>

        {/* Applications */}
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              No applications received yet.
            </p>
            <p className="text-zinc-500 dark:text-zinc-500">
              Applications will appear here once candidates start applying.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
              Candidate Applications ({applications.length})
            </h2>
            
            {applications.map((application, index) => (
              <div
                key={application.id}
                className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
                      Application #{index + 1}
                    </h3>
                    <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
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
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateApplicationStatus(application.id, 'accepted')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-black dark:text-zinc-50 mb-2">Candidate Message</h4>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {application.candidateMessage}
                      </p>
                    </div>
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