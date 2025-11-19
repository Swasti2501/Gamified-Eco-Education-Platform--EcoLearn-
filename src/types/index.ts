export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Hashed password
  role: UserRole;
  schoolId: string;
  schoolName: string;
  classGrade?: string;
  avatarUrl?: string;
  /** 
   * Account status for moderation and verification.
   * - 'active': can log in and use the app
   * - 'pending': waiting for approval (e.g. new teacher)
   * - 'disabled': blocked by admin/super admin
   * If undefined, treat as 'active' for backward compatibility.
   */
  status?: 'active' | 'pending' | 'disabled';
  ecoPoints: number;
  level: number;
  badges: string[];
  completedLessons: string[];
  completedQuizzes: string[];
  completedChallenges: string[];
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  description: string;
  content: string;
  imageUrl: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ecoPoints: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  ecoPoints: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ecoPoints: number;
  duration: number;
  instructions: string[];
  verificationRequired: boolean;
  imageUrl: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  schoolId: string;
  submittedAt: string;
  description: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  category: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  schoolName: string;
  classGrade?: string;
  ecoPoints: number;
  level: number;
  badgeCount: number;
  rank: number;
}

export interface SchoolStats {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  totalEcoPoints: number;
  averagePoints: number;
  completedChallenges: number;
  rank: number;
}

export const ECO_LEVELS = [
  { level: 1, name: 'Eco Beginner', minPoints: 0 },
  { level: 2, name: 'Eco Explorer', minPoints: 100 },
  { level: 3, name: 'Eco Enthusiast', minPoints: 300 },
  { level: 4, name: 'Eco Champion', minPoints: 600 },
  { level: 5, name: 'Eco Hero', minPoints: 1000 },
  { level: 6, name: 'Eco Guardian', minPoints: 1500 },
  { level: 7, name: 'Eco Warrior', minPoints: 2500 },
  { level: 8, name: 'Eco Legend', minPoints: 4000 },
];

export function calculateLevel(points: number): number {
  for (let i = ECO_LEVELS.length - 1; i >= 0; i--) {
    if (points >= ECO_LEVELS[i].minPoints) {
      return ECO_LEVELS[i].level;
    }
  }
  return 1;
}

export function getLevelName(level: number): string {
  const levelData = ECO_LEVELS.find(l => l.level === level);
  return levelData ? levelData.name : 'Eco Beginner';
}

export function getPointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevel = ECO_LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.minPoints - currentPoints : 0;
}