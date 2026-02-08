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
    salary: '',
  });

  const [showToast, setShowToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await jobService.createJob({
        title: formData.title,
        company: formData.company,
        location: formData.location,
        type: formData.type as 'full-time' | 'part-time' | 'contract' | 'remote',
        description: formData.description,
        requirements: formData.requirements,
        salary: formData.salary,
      });

      setShowToast(true);
      setFormData({ title: '', company: '', location: '', type: 'full-time', description: '', requirements: '', salary: '' });
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error posting job. Please try again.');
    }
  };

  const inputClass =
    'w-full px-3.5 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Post a Job
          </h1>
          <button
            onClick={() => (window.location.href = '/recruiter/job-posts')}
            className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            View Posted Jobs
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Job Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className={inputClass} />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Company</label>
            <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Location</label>
              <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Salary Range</label>
            <input type="text" id="salary" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. $80,000 - $120,000" className={inputClass} />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={4} className={inputClass} />
          </div>

          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Requirements</label>
            <textarea id="requirements" name="requirements" value={formData.requirements} onChange={handleChange} required rows={4} className={inputClass} />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Post Job
          </button>
        </form>

        {showToast && (
          <div className="fixed bottom-6 right-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-3 rounded-lg text-sm font-medium shadow-lg z-50">
            Job posted successfully
          </div>
        )}
      </div>
    </div>
  );
}
