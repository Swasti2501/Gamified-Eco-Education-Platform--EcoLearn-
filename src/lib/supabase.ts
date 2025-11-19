import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These should be set as environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with fallback values to prevent errors
// The service layer will check if Supabase is configured before using it
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Database table names
export const TABLES = {
  USERS: 'users',
  CHALLENGE_SUBMISSIONS: 'challenge_submissions',
  COMPLETED_LESSONS: 'completed_lessons',
  COMPLETED_QUIZZES: 'completed_quizzes',
  COMPLETED_CHALLENGES: 'completed_challenges',
} as const;

