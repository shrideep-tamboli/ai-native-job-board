'use client';

import { useState, useEffect } from 'react';
import RecruiterPage from "./recruiter/page";
import CandidatePage from "./candidate/page";

export default function Home() {
  const [userRole, setUserRole] = useState<'recruiter' | 'candidate'>('recruiter');

  useEffect(() => {
    // Retrieve user role from session storage
    const storedRole = sessionStorage.getItem('userRole');
    if (storedRole && (storedRole === 'recruiter' || storedRole === 'candidate')) {
      setUserRole(storedRole);
    }
  }, []);

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
