'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import RecruiterPage from "./recruiter/page";
import CandidatePage from "./candidate/page";

export default function Home() {
  const [userRole, setUserRole] = useState<'recruiter' | 'candidate'>('recruiter');
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    // Retrieve user role from session storage
    const storedRole = sessionStorage.getItem('userRole');
    if (storedRole && (storedRole === 'recruiter' || storedRole === 'candidate')) {
      setUserRole(storedRole);
    }
  }, []);

  // Redirect to auth if not logged in
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mb-4">
            Please Sign In
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            You need to be signed in to access the job board
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In / Sign Up
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
    <div className="min-h-screen">
      {/* Role Switcher */}
      <div className="bg-white dark:bg-black border-b border-black/[.08] dark:border-white/[.145] p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-black dark:text-zinc-50">AI Job Board</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Current Role:</span>
            <select
              value={userRole}
              onChange={(e) => handleRoleChange(e.target.value as 'recruiter' | 'candidate')}
              className="px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recruiter">Recruiter</option>
              <option value="candidate">Candidate</option>
            </select>
            <button
              onClick={signOut}
              className="px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-black text-black dark:text-zinc-50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen">
        {userRole === 'recruiter' ? <RecruiterPage /> : <CandidatePage />}
      </div>
    </div>
  );
}
