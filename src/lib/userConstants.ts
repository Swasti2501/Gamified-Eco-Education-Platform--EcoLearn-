import { User, UserRole } from '@/types';

export const PLATFORM_SCHOOL_ID = 'ecolearn-platform';
export const PLATFORM_SCHOOL_NAME = 'EcoLearn Platform';
export const SUPER_ADMIN_LABEL = 'EcoLearn App Admin';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'School Admin',
  super_admin: SUPER_ADMIN_LABEL,
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function getDisplaySchoolName(user: Pick<User, 'role' | 'schoolName'>): string {
  if (user.role === 'super_admin') {
    return PLATFORM_SCHOOL_NAME;
  }
  return user.schoolName || '—';
}

