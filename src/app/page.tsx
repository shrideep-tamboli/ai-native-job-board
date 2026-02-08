'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import RecruiterPage from "./recruiter/page";
import CandidatePage from "./candidate/page";

export default function Home() {
  const [userRole, setUserRole] = useState<'recruiter' | 'candidate'>('recruiter');
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const storedRole = sessionStorage.getItem('userRole');
    if (storedRole && (storedRole === 'recruiter' || storedRole === 'candidate')) {
      setUserRole(storedRole);
    }
  }, []);

  // Capture GitHub token from OAuth callback (when landing on /) and store in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('github_token');
    if (token) {
      sessionStorage.setItem('github_token', token);
      const url = new URL(window.location.href);
      url.searchParams.delete('github_token');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
            AI Job Board
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
            Sign in to access the job board
          </p>
          <button
            onClick={() => (window.location.href = '/auth')}
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleRoleChange = (role: 'recruiter' | 'candidate') => {
    setUserRole(role);
    sessionStorage.setItem('userRole', role);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-3">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            AI Job Board
          </span>
          <div className="flex items-center gap-3">
            <select
              value={userRole}
              onChange={(e) => handleRoleChange(e.target.value as 'recruiter' | 'candidate')}
              className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            >
              <option value="recruiter">Recruiter</option>
              <option value="candidate">Candidate</option>
            </select>
            <button
              onClick={signOut}
              className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        {userRole === 'recruiter' ? <RecruiterPage /> : <CandidatePage />}
      </main>
    </div>
  );
}
