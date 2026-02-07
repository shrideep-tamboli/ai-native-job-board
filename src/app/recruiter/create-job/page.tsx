'use client';

import { useState } from 'react';
import { jobService } from '@/lib/database';

interface JobFormData {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary: string;
}

export default function CreateJobForm() {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    description: '',
    requirements: '',
    salary: ''
  });

  const [showToast, setShowToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create new job in database
      await jobService.createJob({
        title: formData.title,
        company: formData.company,
        location: formData.location,
        type: formData.type as 'full-time' | 'part-time' | 'contract' | 'remote',
        description: formData.description,
        requirements: formData.requirements,
        salary: formData.salary
      });
      
      // Show success toast
      setShowToast(true);
      
      // Reset form
      setFormData({
        title: '',
        company: '',
        location: '',
        type: 'full-time',
        description: '',
        requirements: '',
        salary: ''
      });
      
      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error posting job. Please try again.');
    }
  };

  const handleNavigateToJobPosts = () => {
    window.location.href = '/recruiter/job-posts';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Post a Job</h1>
          <button
            onClick={handleNavigateToJobPosts}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Posted Jobs
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
              Job Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
              Job Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
              Salary Range
            </label>
            <input
              type="text"
              id="salary"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g., $80,000 - $120,000"
              className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
              Job Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
              Requirements
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Post Job
          </button>
        </form>
        
        {/* Success Toast */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            Job posted successfully!
          </div>
        )}
      </div>
    </div>
  );
}