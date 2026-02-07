'use client';

import { useState, useEffect } from 'react';
import { jobService, applicationService, Job, Application } from '@/lib/database';

export default function CandidateFeedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

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
      // Check if already applied
      const hasAlreadyApplied = await applicationService.hasApplied(job.id);
      if (hasAlreadyApplied) {
        alert('You have already applied for this job!');
        return;
      }
      
      setSelectedJob(job);
      setShowApplicationForm(true);
      setApplicationMessage('');
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob || !applicationMessage.trim()) {
      return;
    }

    try {
      // Create new application
      await applicationService.createApplication({
        job_id: selectedJob.id,
        candidate_message: applicationMessage,
        status: 'pending',
        candidate_id: '' // This will be automatically set by the service
      });
      
      // Show success toast and close form
      setShowToast(true);
      setShowApplicationForm(false);
      setApplicationMessage('');
      setSelectedJob(null);
      
      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    }
  };

  const handleNavigateToApplications = () => {
    window.location.href = '/candidate/past-applications';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Available Jobs</h1>
          <button
            onClick={handleNavigateToApplications}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Applications
          </button>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              No jobs available at the moment.
            </p>
            <p className="text-zinc-500 dark:text-zinc-500">
              Check back later for new opportunities!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 shadow-sm"
              >
                <div className="mb-4">
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
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                    Posted on {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="space-y-4 mb-6">
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
                
                <button
                  onClick={() => handleApplyClick(job)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-black dark:text-zinc-50 mb-4">
              Apply for {selectedJob.title}
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <strong>Company:</strong> {selectedJob.company}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Location:</strong> {selectedJob.location}
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="applicationMessage" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                Why are you interested in this position? *
              </label>
              <textarea
                id="applicationMessage"
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Tell us why you're a good fit for this role..."
                rows={6}
                className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmitApplication}
                disabled={!applicationMessage.trim()}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  applicationMessage.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Application
              </button>
              <button
                onClick={() => {
                  setShowApplicationForm(false);
                  setSelectedJob(null);
                  setApplicationMessage('');
                }}
                className="flex-1 py-3 px-6 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Application submitted successfully!
        </div>
      )}
    </div>
  );
}