import { User, ChallengeSubmission, LeaderboardEntry, Lesson, Quiz, Challenge, UserRole } from '@/types';
import { hashPassword } from './utils';
import * as supabaseService from './supabaseService';
import { LESSONS as SAMPLE_LESSONS, QUIZZES as SAMPLE_QUIZZES, CHALLENGES as SAMPLE_CHALLENGES } from './sampleData';
import { PLATFORM_SCHOOL_ID, PLATFORM_SCHOOL_NAME } from './userConstants';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

const STORAGE_KEYS = {
  CURRENT_USER: 'eco_current_user',
  USERS: 'eco_users',
  SUBMISSIONS: 'eco_submissions',
  COMPLETED_LESSONS: 'eco_completed_lessons',
  COMPLETED_QUIZZES: 'eco_completed_quizzes',
  COMPLETED_CHALLENGES: 'eco_completed_challenges',
  LESSONS: 'eco_lessons',
  QUIZZES: 'eco_quizzes',
  CHALLENGES: 'eco_challenges',
  ADMIN_CODES: 'eco_admin_codes',
  ACTIVITY_LOGS: 'eco_activity_logs',
};

// Types for admin validation codes (used by super admin panel)
export interface AdminCode {
  id: string;
  /** 5-digit unique code used once to create a school/college admin */
  code: string;
  schoolId: string;
  schoolName: string;
  isUsed: boolean;
  createdAt: string;
  usedAt?: string;
}

// User Management
export function saveCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export async function getAllUsers(): Promise<User[]> {
  try {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getAllUsersFromSupabase();
      } catch (error) {
        console.error('Error fetching users from Supabase, falling back to localStorage:', error);
        // Fallback to localStorage
      }
    }
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

// Synchronous version for backward compatibility (uses localStorage)
export function getAllUsersSync(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export async function saveUser(user: User): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseService.saveUserToSupabase(user);
      return;
    } catch (error) {
      console.error('Error saving user to Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
    }
  }
  const users = getAllUsersSync();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export async function deleteUser(userId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseService.deleteUserFromSupabase(userId);
      const currentUser = getCurrentUser();
      if (currentUser?.id === userId) {
        clearCurrentUser();
      }
      return;
    } catch (error) {
      console.error('Error deleting user from Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
    }
  }

  const users = getAllUsersSync();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

  const currentUser = getCurrentUser();
  if (currentUser?.id === userId) {
    clearCurrentUser();
  }
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'pending' | 'disabled'
): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseService.updateUserStatusInSupabase(userId, status);
      const currentUser = getCurrentUser();
      if (currentUser?.id === userId) {
        const updatedUser = { ...currentUser, status };
        saveCurrentUser(updatedUser);
      }
      return;
    } catch (error) {
      console.error('Error updating user status in Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
    }
  }

  const users = getAllUsersSync();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  user.status = status;
  await saveUser(user);

  const currentUser = getCurrentUser();
  if (currentUser?.id === userId) {
    saveCurrentUser(user);
  }
}

// Admin code helpers
export function getAdminCodes(): AdminCode[] {
  const data = localStorage.getItem(STORAGE_KEYS.ADMIN_CODES);
  return data ? JSON.parse(data) : [];
}

export function saveAdminCodes(codes: AdminCode[]): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_CODES, JSON.stringify(codes));
}

export function createAdminCodeForSchool(schoolName: string): AdminCode {
  const normalizedName = schoolName.trim();
  const schoolId = `school-${normalizedName.toLowerCase().replace(/\s+/g, '-')}`;
  const existingCodes = getAdminCodes();

  // If there is already an unused code for this school, reuse it
  const existingUnused = existingCodes.find(
    (c) =>
      !c.isUsed &&
      (c.schoolId === schoolId ||
        c.schoolName.toLowerCase() === normalizedName.toLowerCase())
  );
  if (existingUnused) {
    return existingUnused;
  }

  // Simple 5-digit unique code generator
  let code: string;
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString();
  } while (existingCodes.some((c) => c.code === code));

  const newCode: AdminCode = {
    id: `admin-code-${Date.now()}`,
    code,
    schoolId,
    schoolName: normalizedName,
    isUsed: false,
    createdAt: new Date().toISOString(),
  };

  saveAdminCodes([...existingCodes, newCode]);
  return newCode;
}

export function markAdminCodeUsed(code: string): void {
  const codes = getAdminCodes();
  const target = codes.find(c => c.code === code);
  if (!target) return;
  target.isUsed = true;
  target.usedAt = new Date().toISOString();
  saveAdminCodes(codes);
}

export function getAdminCodeByCode(code: string): AdminCode | undefined {
  const codes = getAdminCodes();
  return codes.find(c => c.code === code);
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetUserId?: string;
  targetUserName?: string;
  details?: string;
}

const MAX_ACTIVITY_LOGS = 500;

export function getActivityLogs(limit?: number): ActivityLogEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
  const logs: ActivityLogEntry[] = data ? JSON.parse(data) : [];
  if (typeof limit === 'number') {
    return logs.slice(0, limit);
  }
  return logs;
}

export function logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): void {
  const logs = getActivityLogs();
  const newEntry: ActivityLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    ...entry,
  };
  const updated = [newEntry, ...logs].slice(0, MAX_ACTIVITY_LOGS);
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
}

export async function updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseService.updateUserPointsInSupabase(userId, pointsToAdd);
      // Also update current user if needed
      const currentUser = getCurrentUser();
      if (currentUser?.id === userId) {
        const users = await getAllUsers();
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          saveCurrentUser(updatedUser);
        }
      }
      return;
    } catch (error) {
      console.error('Error updating user points in Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
    }
  }
  const users = getAllUsersSync();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.ecoPoints += pointsToAdd;
    user.level = calculateLevel(user.ecoPoints);
    await saveUser(user);
    if (getCurrentUser()?.id === userId) {
      saveCurrentUser(user);
    }
  }
}

function calculateLevel(points: number): number {
  if (points >= 4000) return 8;
  if (points >= 2500) return 7;
  if (points >= 1500) return 6;
  if (points >= 1000) return 5;
  if (points >= 600) return 4;
  if (points >= 300) return 3;
  if (points >= 100) return 2;
  return 1;
}

export async function addBadgeToUser(userId: string, badgeId: string): Promise<void> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const user = users.find(u => u.id === userId);
  if (user && !user.badges.includes(badgeId)) {
    user.badges.push(badgeId);
    await saveUser(user);
    if (getCurrentUser()?.id === userId) {
      saveCurrentUser(user);
    }
  }
}

// Lesson Completion
export async function markLessonComplete(userId: string, lessonId: string): Promise<void> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const user = users.find(u => u.id === userId);
  if (user && !user.completedLessons.includes(lessonId)) {
    user.completedLessons.push(lessonId);
    await saveUser(user);
    if (getCurrentUser()?.id === userId) {
      saveCurrentUser(user);
    }
  }
}

// Quiz Completion
export async function markQuizComplete(userId: string, quizId: string): Promise<void> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const user = users.find(u => u.id === userId);
  if (user && !user.completedQuizzes.includes(quizId)) {
    user.completedQuizzes.push(quizId);
    await saveUser(user);
    if (getCurrentUser()?.id === userId) {
      saveCurrentUser(user);
    }
  }
}

// Challenge Completion
export async function markChallengeComplete(userId: string, challengeId: string): Promise<void> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const user = users.find(u => u.id === userId);
  if (user && !user.completedChallenges.includes(challengeId)) {
    user.completedChallenges.push(challengeId);
    await saveUser(user);
    if (getCurrentUser()?.id === userId) {
      saveCurrentUser(user);
    }
  }
}

// Challenge Submissions
export async function saveSubmission(submission: ChallengeSubmission): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseService.saveSubmissionToSupabase(submission);
      return;
    } catch (error) {
      console.error('Error saving submission to Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
    }
  }
  const submissions = getAllSubmissionsSync();
  submissions.push(submission);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
}

export async function getAllSubmissions(): Promise<ChallengeSubmission[]> {
  try {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getAllSubmissionsFromSupabase();
      } catch (error) {
        console.error('Error fetching submissions from Supabase, falling back to localStorage:', error);
        // Fallback to localStorage
      }
    }
    const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error in getAllSubmissions:', error);
    return [];
  }
}

// Synchronous version for backward compatibility
export function getAllSubmissionsSync(): ChallengeSubmission[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  return data ? JSON.parse(data) : [];
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'approved' | 'rejected',
  verifiedBy: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseService.updateSubmissionStatusInSupabase(submissionId, status, verifiedBy);
      // Handle approval logic for Supabase
      if (status === 'approved') {
        const allSubmissions = await getAllSubmissions();
        const submission = allSubmissions.find(s => s.id === submissionId);
        if (submission) {
          await handleChallengeApproval(submission);
        }
      }
      return;
    } catch (error) {
      console.error('Error updating submission status in Supabase, falling back to localStorage:', error);
      // Fallback to localStorage
    }
  }
  const submissions = getAllSubmissionsSync();
  const submission = submissions.find(s => s.id === submissionId);
  if (submission) {
    submission.status = status;
    submission.verifiedBy = verifiedBy;
    submission.verifiedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    
    // Handle approval logic for localStorage
    if (status === 'approved') {
      await handleChallengeApproval(submission);
    }
  }
}

async function handleChallengeApproval(submission: ChallengeSubmission): Promise<void> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const user = users.find(u => u.id === submission.userId);
  if (!user) return;

  const challenge = getAllChallenges().find(c => c.id === submission.challengeId);
  if (!challenge) return;

  // Only mark as complete if not already completed
  if (!user.completedChallenges.includes(submission.challengeId)) {
    const currentCompletedCount = user.completedChallenges.length;
    
    await markChallengeComplete(user.id, submission.challengeId);
    await updateUserPoints(user.id, challenge.ecoPoints);

    // Check for first challenge badge (before marking complete, count was 0)
    if (currentCompletedCount === 0) {
      await addBadgeToUser(user.id, 'first-challenge');
    }

    // Check for challenge hero badge (after marking complete, count will be 5)
    if (currentCompletedCount + 1 >= 5) {
      await addBadgeToUser(user.id, 'challenge-hero');
    }

    // Check for specific challenge badges
    if (submission.challengeId === 'challenge-1') {
      await addBadgeToUser(user.id, 'tree-planter');
    } else if (submission.challengeId === 'challenge-2') {
      await addBadgeToUser(user.id, 'plastic-warrior');
    } else if (submission.challengeId === 'challenge-3') {
      await addBadgeToUser(user.id, 'water-guardian');
    } else if (submission.challengeId === 'challenge-4') {
      await addBadgeToUser(user.id, 'community-leader');
    }
  }
}

// Leaderboard
export async function getLeaderboard(schoolId?: string): Promise<LeaderboardEntry[]> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  let studentUsers = users.filter(u => u.role === 'student');
  
  if (schoolId) {
    studentUsers = studentUsers.filter(u => u.schoolId === schoolId);
  }
  
  const leaderboard: LeaderboardEntry[] = studentUsers
    .map(u => ({
      userId: u.id,
      userName: u.name,
      schoolName: u.schoolName,
      classGrade: u.classGrade,
      ecoPoints: u.ecoPoints,
      level: u.level,
      badgeCount: u.badges.length,
      rank: 0,
    }))
    .sort((a, b) => b.ecoPoints - a.ecoPoints);
  
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return leaderboard;
}

// Migrate existing users without passwords (for backward compatibility)
async function migrateUsersWithoutPasswords(): Promise<void> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const defaultPassword = 'password123';
  const hashedPassword = await hashPassword(defaultPassword);
  let needsUpdate = false;

  const migratedUsers = users.map(user => {
    if (!user.password) {
      needsUpdate = true;
      return { ...user, password: hashedPassword };
    }
    return user;
  });

  if (needsUpdate) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migratedUsers));
    // Also update current user if they don't have a password
    const currentUser = getCurrentUser();
    if (currentUser && !currentUser.password) {
      const updatedCurrentUser = { ...currentUser, password: hashedPassword };
      saveCurrentUser(updatedCurrentUser);
    }
  }
}

// Lessons Management
export function getAllLessons(): Lesson[] {
  const data = localStorage.getItem(STORAGE_KEYS.LESSONS);
  if (data) {
    return JSON.parse(data);
  }
  // Initialize with sample data if not exists
  localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(SAMPLE_LESSONS));
  return SAMPLE_LESSONS;
}

export function saveLesson(lesson: Lesson): void {
  const lessons = getAllLessons();
  const index = lessons.findIndex(l => l.id === lesson.id);
  if (index >= 0) {
    lessons[index] = lesson;
  } else {
    lessons.push(lesson);
  }
  localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
}

export function deleteLesson(lessonId: string): void {
  const lessons = getAllLessons();
  const filtered = lessons.filter(l => l.id !== lessonId);
  localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(filtered));
}

export function getLessonById(lessonId: string): Lesson | undefined {
  const lessons = getAllLessons();
  return lessons.find(l => l.id === lessonId);
}

// Quizzes Management
export function getAllQuizzes(): Quiz[] {
  const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
  if (data) {
    return JSON.parse(data);
  }
  // Initialize with sample data if not exists
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(SAMPLE_QUIZZES));
  return SAMPLE_QUIZZES;
}

export function saveQuiz(quiz: Quiz): void {
  const quizzes = getAllQuizzes();
  const index = quizzes.findIndex(q => q.id === quiz.id);
  if (index >= 0) {
    quizzes[index] = quiz;
  } else {
    quizzes.push(quiz);
  }
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
}

export function deleteQuiz(quizId: string): void {
  const quizzes = getAllQuizzes();
  const filtered = quizzes.filter(q => q.id !== quizId);
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(filtered));
}

export function getQuizById(quizId: string): Quiz | undefined {
  const quizzes = getAllQuizzes();
  return quizzes.find(q => q.id === quizId);
}

// Challenges Management
export function getAllChallenges(): Challenge[] {
  const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
  if (data) {
    return JSON.parse(data);
  }
  // Initialize with sample data if not exists
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(SAMPLE_CHALLENGES));
  return SAMPLE_CHALLENGES;
}

export function saveChallenge(challenge: Challenge): void {
  const challenges = getAllChallenges();
  const index = challenges.findIndex(c => c.id === challenge.id);
  if (index >= 0) {
    challenges[index] = challenge;
  } else {
    challenges.push(challenge);
  }
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
}

export function deleteChallenge(challengeId: string): void {
  const challenges = getAllChallenges();
  const filtered = challenges.filter(c => c.id !== challengeId);
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(filtered));
}

export function getChallengeById(challengeId: string): Challenge | undefined {
  const challenges = getAllChallenges();
  return challenges.find(c => c.id === challengeId);
}

// Initialize demo data
export async function initializeDemoData(): Promise<void> {
  // First, migrate any existing users without passwords
  await migrateUsersWithoutPasswords();
  
  // Initialize lessons, quizzes, and challenges if they don't exist
  getAllLessons();
  getAllQuizzes();
  getAllChallenges();
  
  const existingUsers = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  if (existingUsers.length === 0) {
    await seedDemoUsers();
  } else {
    await ensureDefaultSuperAdmin();
  }

  await normalizeSuperAdmins();
}

async function seedDemoUsers(): Promise<void> {
  const defaultPassword = 'password123';
  const hashedPassword = await hashPassword(defaultPassword);

  const demoUsers: User[] = [
    {
      id: 'demo-super-admin-1',
      name: 'EcoLearn Super Admin',
      email: 'superadmin@ecolearn.com',
      password: hashedPassword,
      role: 'super_admin',
      schoolId: PLATFORM_SCHOOL_ID,
      schoolName: PLATFORM_SCHOOL_NAME,
      ecoPoints: 0,
      level: 1,
      badges: [],
      completedLessons: [],
      completedQuizzes: [],
      completedChallenges: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 'demo-student-1',
      name: 'Rahul Kumar',
      email: 'rahul@student.com',
      password: hashedPassword,
      role: 'student',
      schoolId: 'school-1',
      schoolName: 'Green Valley High School',
      classGrade: '10th Grade',
      ecoPoints: 450,
      level: 3,
      badges: ['first-lesson', 'quiz-master'],
      completedLessons: ['lesson-1', 'lesson-2'],
      completedQuizzes: ['quiz-1'],
      completedChallenges: ['challenge-1'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-teacher-1',
      name: 'Dr. Priya Sharma',
      email: 'priya@teacher.com',
      password: hashedPassword,
      role: 'teacher',
      schoolId: 'school-1',
      schoolName: 'Green Valley High School',
      ecoPoints: 0,
      level: 1,
      badges: [],
      completedLessons: [],
      completedQuizzes: [],
      completedChallenges: [],
      createdAt: new Date().toISOString(),
      status: 'pending',
    },
    {
      id: 'demo-admin-1',
      name: 'Principal Rajesh Verma',
      email: 'rajesh@admin.com',
      password: hashedPassword,
      role: 'admin',
      schoolId: 'school-1',
      schoolName: 'Green Valley High School',
      ecoPoints: 0,
      level: 1,
      badges: [],
      completedLessons: [],
      completedQuizzes: [],
      completedChallenges: [],
      createdAt: new Date().toISOString(),
    },
  ];

  for (const user of demoUsers) {
    await saveUser(user);
  }
}

async function ensureDefaultSuperAdmin(): Promise<void> {
  const defaultEmail = 'superadmin@ecolearn.com';
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const existing = users.find(
    (u) => u.email?.toLowerCase() === defaultEmail.toLowerCase()
  );
  if (existing) {
    return;
  }

  const hashedPassword = await hashPassword('password123');
  const newSuperAdmin: User = {
    id: `super-admin-${Date.now()}`,
    name: 'EcoLearn Super Admin',
    email: defaultEmail,
    password: hashedPassword,
    role: 'super_admin',
    schoolId: PLATFORM_SCHOOL_ID,
    schoolName: PLATFORM_SCHOOL_NAME,
    ecoPoints: 0,
    level: 1,
    badges: [],
    completedLessons: [],
    completedQuizzes: [],
    completedChallenges: [],
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  await saveUser(newSuperAdmin);
}

async function normalizeSuperAdmins(): Promise<void> {
  const users = isSupabaseConfigured() ? await getAllUsers() : getAllUsersSync();
  const superAdminsNeedingUpdate = users.filter(
    (user) =>
      user.role === 'super_admin' &&
      (user.schoolId !== PLATFORM_SCHOOL_ID || user.schoolName !== PLATFORM_SCHOOL_NAME)
  );

  if (superAdminsNeedingUpdate.length === 0) {
    return;
  }

  for (const admin of superAdminsNeedingUpdate) {
    admin.schoolId = PLATFORM_SCHOOL_ID;
    admin.schoolName = PLATFORM_SCHOOL_NAME;
    await saveUser(admin);
  }
}