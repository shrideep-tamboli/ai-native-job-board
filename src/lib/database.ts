import { supabase } from './supabase'

// Types for our database
export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'remote'
  description: string
  requirements: string
  salary?: string
  created_at: string
  updated_at: string
  recruiter_id: string
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  candidate_message: string
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface ApplicationWithProfile extends Application {
  user_profiles?: {
    full_name?: string
    email?: string
  }
}

export interface JobWithApplications extends Job {
  applications: Application[]
  application_count: number
}

// Job operations
export const jobService = {
  // Create a new job
  async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'recruiter_id'>) {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...job,
        recruiter_id: (await supabase.auth.getUser()).data?.user?.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get all jobs
  async getAllJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get job by ID with applications
  async getJobById(jobId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        applications (
          id,
          candidate_id,
          candidate_message,
          status,
          applied_at,
          updated_at
        )
      `)
      .eq('id', jobId)
      .single()

    if (error) throw error
    return data
  },

  // Update job
  async updateJob(jobId: string, updates: Partial<Job>) {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete job
  async deleteJob(jobId: string) {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) throw error
    return true
  },

  // Get jobs posted by current user
  async getMyJobs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('recruiter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

// Application operations
export const applicationService = {
  // Create a new application
  async createApplication(application: Omit<Application, 'id' | 'applied_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...application,
        candidate_id: (await supabase.auth.getUser()).data?.user?.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get applications for a specific job
  async getApplicationsByJobId(jobId: string) {
    console.log('Querying applications for jobId:', jobId);
    
    // First try a simple query without the join
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false })

    console.log('Query result:', { data, error });
    console.log('Applications found:', data?.length || 0);

    if (error) {
      console.error('Database error:', error);
      throw error
    }
    return data || []
  },

  // Get applications submitted by current user
  async getMyApplications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id,
          title,
          company,
          location,
          type,
          salary
        )
      `)
      .eq('candidate_id', user.id)
      .order('applied_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Update application status
  async updateApplicationStatus(applicationId: string, status: 'pending' | 'accepted' | 'rejected') {
    const { data, error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete application
  async deleteApplication(applicationId: string) {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)

    if (error) throw error
    return true
  },

  // Check if user has already applied for a job
  async hasApplied(jobId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }
}

// User profile operations
export const profileService = {
  // Get user profile
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Create or update user profile
  async upsertProfile(profile: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        ...profile,
        user_id: (await supabase.auth.getUser()).data?.user?.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Authentication helpers
export const authService = {
  // Sign up
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (error) throw error
    return data
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
