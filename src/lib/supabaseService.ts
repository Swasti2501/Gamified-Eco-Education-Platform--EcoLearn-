import { supabase, TABLES } from './supabase';
import { User, ChallengeSubmission, LeaderboardEntry } from '@/types';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

// User Management
export async function saveUserToSupabase(user: User): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from(TABLES.USERS)
    .upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      school_id: user.schoolId,
      school_name: user.schoolName,
      class_grade: user.classGrade,
      avatar_url: user.avatarUrl,
      eco_points: user.ecoPoints,
      level: user.level,
      badges: user.badges,
      completed_lessons: user.completedLessons,
      completed_quizzes: user.completedQuizzes,
      completed_challenges: user.completedChallenges,
      created_at: user.createdAt,
      status: user.status ?? 'active',
    }, {
      onConflict: 'id'
    });

  if (error) {
    console.error('Error saving user to Supabase:', error);
    throw error;
  }
}

export async function getAllUsersFromSupabase(): Promise<User[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*');

  if (error) {
    console.error('Error fetching users from Supabase:', error);
    throw error;
  }

  // Transform database format to User format
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    schoolId: row.school_id,
    schoolName: row.school_name,
    classGrade: row.class_grade,
    avatarUrl: row.avatar_url,
    ecoPoints: row.eco_points,
    level: row.level,
    badges: row.badges || [],
    completedLessons: row.completed_lessons || [],
    completedQuizzes: row.completed_quizzes || [],
    completedChallenges: row.completed_challenges || [],
    createdAt: row.created_at,
    status: row.status ?? 'active',
  }));
}

export async function getUserByEmailFromSupabase(email: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching user from Supabase:', error);
    throw error;
  }

  if (!data) return null;

  // Transform database format to User format
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    schoolId: data.school_id,
    schoolName: data.school_name,
    classGrade: data.class_grade,
    avatarUrl: data.avatar_url,
    ecoPoints: data.eco_points,
    level: data.level,
    badges: data.badges || [],
    completedLessons: data.completed_lessons || [],
    completedQuizzes: data.completed_quizzes || [],
    completedChallenges: data.completed_challenges || [],
    createdAt: data.created_at,
    status: data.status ?? 'active',
  };
}

export async function updateUserPointsInSupabase(userId: string, pointsToAdd: number): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  // First get the user
  const { data: userData, error: fetchError } = await supabase
    .from(TABLES.USERS)
    .select('eco_points, level')
    .eq('id', userId)
    .single();

  if (fetchError || !userData) {
    throw new Error('User not found');
  }

  const newPoints = userData.eco_points + pointsToAdd;
  // Calculate level based on points
  let newLevel = 1;
  if (newPoints >= 4000) newLevel = 8;
  else if (newPoints >= 2500) newLevel = 7;
  else if (newPoints >= 1500) newLevel = 6;
  else if (newPoints >= 1000) newLevel = 5;
  else if (newPoints >= 600) newLevel = 4;
  else if (newPoints >= 300) newLevel = 3;
  else if (newPoints >= 100) newLevel = 2;

  const { error } = await supabase
    .from(TABLES.USERS)
    .update({
      eco_points: newPoints,
      level: newLevel,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user points in Supabase:', error);
    throw error;
  }
}

// Challenge Submissions
export async function saveSubmissionToSupabase(submission: ChallengeSubmission): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from(TABLES.CHALLENGE_SUBMISSIONS)
    .insert({
      id: submission.id,
      challenge_id: submission.challengeId,
      user_id: submission.userId,
      user_name: submission.userName,
      school_id: submission.schoolId,
      submitted_at: submission.submittedAt,
      description: submission.description,
      photo_url: submission.photoUrl,
      status: submission.status,
      verified_by: submission.verifiedBy,
      verified_at: submission.verifiedAt,
    });

  if (error) {
    console.error('Error saving submission to Supabase:', error);
    throw error;
  }
}

export async function getAllSubmissionsFromSupabase(): Promise<ChallengeSubmission[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.CHALLENGE_SUBMISSIONS)
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions from Supabase:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    challengeId: row.challenge_id,
    userId: row.user_id,
    userName: row.user_name,
    schoolId: row.school_id,
    submittedAt: row.submitted_at,
    description: row.description,
    photoUrl: row.photo_url,
    status: row.status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
  }));
}

export async function updateSubmissionStatusInSupabase(
  submissionId: string,
  status: 'approved' | 'rejected',
  verifiedBy: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from(TABLES.CHALLENGE_SUBMISSIONS)
    .update({
      status,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Error updating submission status in Supabase:', error);
    throw error;
  }
}

export async function updateUserStatusInSupabase(
  userId: string,
  status: 'active' | 'pending' | 'disabled'
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from(TABLES.USERS)
    .update({ status })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user status in Supabase:', error);
    throw error;
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from(TABLES.USERS)
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user from Supabase:', error);
    throw error;
  }
}

// Real-time subscription for submissions (for teacher/admin dashboards)
export function subscribeToSubmissions(
  callback: (submission: ChallengeSubmission) => void,
  schoolId?: string
) {
  if (!isSupabaseConfigured()) {
    return () => {}; // Return empty unsubscribe function
  }

  let query = supabase
    .from(TABLES.CHALLENGE_SUBMISSIONS)
    .select('*');

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }
// @ts-ignore
  const subscription = query.on('INSERT', (payload) => {
    const row = payload.new;
    callback({
      id: row.id,
      challengeId: row.challenge_id,
      userId: row.user_id,
      userName: row.user_name,
      schoolId: row.school_id,
      submittedAt: row.submitted_at,
      description: row.description,
      photoUrl: row.photo_url,
      status: row.status,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
    });
  }).subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

