'use client';

import { useState, useEffect } from 'react';
import { jobService, applicationService, Job, Application } from '@/lib/database';

// Application Card Component
function ApplicationCard({ 
  application, 
  index, 
  onUpdateStatus 
}: { 
  application: Application;
  index: number;
  onUpdateStatus: (id: string, status: 'pending' | 'accepted' | 'rejected') => Promise<void>;
}) {
  return (
    <div className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.145] rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-md font-semibold text-black dark:text-zinc-50 mb-2">
            Application #{index + 1}
          </h4>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            <span>
              <strong>Applied:</strong> {new Date(application.applied_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1">
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdateStatus(application.id, 'accepted')}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onUpdateStatus(application.id, 'rejected')}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h5 className="font-medium text-black dark:text-zinc-50 mb-1 text-sm">Candidate Information</h5>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
            <div>
              <strong>Candidate ID:</strong> {application.candidate_id}
            </div>
          </div>
        </div>
        
        {application.candidate_message && (
          <div>
            <h5 className="font-medium text-black dark:text-zinc-50 mb-1 text-sm">Candidate Message</h5>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded text-xs">
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {application.candidate_message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    // Get job ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');
    
    if (jobId) {
      loadJobAndApplications(jobId);
    }
  }, []);

  const loadJobAndApplications = async (jobId: string) => {
    try {
      console.log('Loading data for jobId:', jobId);
      
      // Load job from database
      const jobData = await jobService.getJobById(jobId);
      console.log('Job data:', jobData);
      setJob(jobData);
      
      // Load applications for this job
      const applicationsData = await applicationService.getApplicationsByJobId(jobId);
      console.log('Applications data:', applicationsData);
      console.log('Applications count:', applicationsData?.length || 0);
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Error loading job and applications:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      // Refresh applications list
      if (job) {
        const updatedApplications = await applicationService.getApplicationsByJobId(job.id);
        setApplications(updatedApplications);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
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
                <strong>Posted:</strong> {new Date(job.created_at).toLocaleDateString()}
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
            
            {/* Group applications by status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Applications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-yellow-600 dark:text-yellow-400 border-b border-yellow-200 dark:border-yellow-800 pb-2">
                  Pending ({applications.filter(app => app.status === 'pending').length})
                </h3>
                {applications.filter(app => app.status === 'pending').map((application, index) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application} 
                    index={index} 
                    onUpdateStatus={handleUpdateApplicationStatus}
                  />
                ))}
                {applications.filter(app => app.status === 'pending').length === 0 && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">No pending applications</p>
                )}
              </div>

              {/* Accepted Applications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-green-600 dark:text-green-400 border-b border-green-200 dark:border-green-800 pb-2">
                  Accepted ({applications.filter(app => app.status === 'accepted').length})
                </h3>
                {applications.filter(app => app.status === 'accepted').map((application, index) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application} 
                    index={index} 
                    onUpdateStatus={handleUpdateApplicationStatus}
                  />
                ))}
                {applications.filter(app => app.status === 'accepted').length === 0 && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">No accepted applications</p>
                )}
              </div>

              {/* Rejected Applications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-800 pb-2">
                  Rejected ({applications.filter(app => app.status === 'rejected').length})
                </h3>
                {applications.filter(app => app.status === 'rejected').map((application, index) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application} 
                    index={index} 
                    onUpdateStatus={handleUpdateApplicationStatus}
                  />
                ))}
                {applications.filter(app => app.status === 'rejected').length === 0 && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">No rejected applications</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}