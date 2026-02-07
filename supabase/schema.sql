-- AI Job Board Database Schema
-- Create tables for jobs, applications, and user roles

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table for storing job postings
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'remote')),
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  salary VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Applications table for storing job applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, candidate_id) -- Prevent duplicate applications
);

-- User profiles table for additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs table
-- Users can view all jobs
CREATE POLICY "Jobs are viewable by everyone" ON jobs
  FOR SELECT USING (true);

-- Only authenticated users can insert jobs
CREATE POLICY "Authenticated users can create jobs" ON jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can only update their own jobs
CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = recruiter_id);

-- Users can only delete their own jobs
CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid() = recruiter_id);

-- RLS Policies for applications table
-- Users can view applications for jobs they posted or applications they submitted
CREATE POLICY "Users can view relevant applications" ON applications
  FOR SELECT USING (
    auth.uid() = candidate_id OR 
    auth.uid() = (SELECT recruiter_id FROM jobs WHERE id = job_id)
  );

-- Only authenticated users can insert applications (only as candidates)
CREATE POLICY "Authenticated users can create applications" ON applications
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = candidate_id
  );

-- Users can only update their own applications
CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = candidate_id);

-- Recruiters can update application status for their jobs
CREATE POLICY "Recruiters can update application status" ON applications
  FOR UPDATE USING (
    auth.uid() = (SELECT recruiter_id FROM jobs WHERE id = job_id)
  );

-- Users can only delete their own applications
CREATE POLICY "Users can delete own applications" ON applications
  FOR DELETE USING (auth.uid() = candidate_id);

-- RLS Policies for user_profiles table
-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to get application count for jobs
CREATE OR REPLACE FUNCTION get_application_count(job_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM applications 
  WHERE job_id = job_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
