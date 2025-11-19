import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, updateUserStatus, deleteUser, logActivity } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, UserCheck, TrendingUp, Award, Target, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = useCallback(async (showLoading = true) => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const users = await getAllUsers().catch(err => {
        console.error('Error getting users:', err);
        return [];
      });
      setAllUsers(users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users. Please try refreshing.');
      // Set empty array on error so component still renders
      setAllUsers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadUsers(true);
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadUsers(false);
    }, 30000);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUsers(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, loadUsers]);

  const handleManualRefresh = () => {
    loadUsers(false);
    toast.success('Data refreshed');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter by schoolId (case-insensitive match for school name)
  const schoolUsers = (allUsers || []).filter(u => 
    u.schoolId === user?.schoolId || (u.schoolName?.toLowerCase() === user?.schoolName?.toLowerCase())
  );
  
  const students = schoolUsers.filter(u => u.role === 'student');
  const teachers = schoolUsers.filter(u => u.role === 'teacher');
  const admins = schoolUsers.filter(u => u.role === 'admin');

  const pendingTeachers = teachers.filter(t => (t.status ?? 'active') === 'pending');
  const activeTeachers = teachers.filter(t => (t.status ?? 'active') === 'active');

  const totalEcoPoints = students.reduce((sum, s) => sum + (s.ecoPoints || 0), 0);
  const avgEcoPoints = students.length > 0 ? Math.round(totalEcoPoints / students.length) : 0;
  
  const totalLessonsCompleted = students.reduce((sum, s) => sum + (s.completedLessons?.length || 0), 0);
  const totalChallengesCompleted = students.reduce((sum, s) => sum + (s.completedChallenges?.length || 0), 0);
  const totalBadgesEarned = students.reduce((sum, s) => sum + (s.badges?.length || 0), 0);

  const topStudents = [...students]
    .sort((a, b) => b.ecoPoints - a.ecoPoints)
    .slice(0, 10);

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      await updateUserStatus(teacherId, 'active');
      const teacher = teachers.find(t => t.id === teacherId);
      if (teacher && user) {
        logActivity({
          action: 'approve_teacher',
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          targetUserId: teacher.id,
          targetUserName: teacher.name,
          details: `Approved teacher for ${teacher.schoolName}`,
        });
      }
      toast.success('Teacher approved successfully');
      loadUsers(false);
    } catch (error) {
      console.error('Error approving teacher', error);
      toast.error('Failed to approve teacher');
    }
  };

  const handleDisableTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to disable this teacher account?')) return;
    try {
      await updateUserStatus(teacherId, 'disabled');
      const teacher = teachers.find(t => t.id === teacherId);
      if (teacher && user) {
        logActivity({
          action: 'disable_teacher',
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          targetUserId: teacher.id,
          targetUserName: teacher.name,
          details: `Disabled teacher account`,
        });
      }
      toast.success('Teacher disabled successfully');
      loadUsers(false);
    } catch (error) {
      console.error('Error disabling teacher', error);
      toast.error('Failed to disable teacher');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      const target = schoolUsers.find(u => u.id === userId);
      await deleteUser(userId);
      if (target && user) {
        logActivity({
          action: 'delete_user',
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          targetUserId: target.id,
          targetUserName: target.name,
          details: `Removed ${target.role} from ${target.schoolName}`,
        });
      }
      toast.success('User deleted successfully');
      loadUsers(false);
    } catch (error) {
      console.error('Error deleting user', error);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            School Admin Dashboard
          </h1>
          <p className="text-gray-600">
            {user?.schoolName || 'No school assigned'}
          </p>
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-4xl font-bold">{students.length}</p>
              </div>
              <GraduationCap className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Teachers</p>
                <p className="text-4xl font-bold">{teachers.length}</p>
              </div>
              <UserCheck className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Administrators</p>
                <p className="text-4xl font-bold">{admins.length}</p>
              </div>
              <Users className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Eco Points</p>
                <p className="text-3xl font-bold text-green-600">{totalEcoPoints}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Points/Student</p>
                <p className="text-3xl font-bold text-blue-600">{avgEcoPoints}</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lessons Completed</p>
                <p className="text-3xl font-bold text-purple-600">{totalLessonsCompleted}</p>
              </div>
              <Target className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Badges Earned</p>
                <p className="text-3xl font-bold text-orange-600">{totalBadgesEarned}</p>
              </div>
              <Award className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>School Leaderboard - Top 10 Students</CardTitle>
          <CardDescription>Students with highest eco-points in your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topStudents.map((student, index) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`text-2xl font-bold ${
                      index === 0
                        ? 'text-yellow-500'
                        : index === 1
                        ? 'text-gray-400'
                        : index === 2
                        ? 'text-orange-600'
                        : 'text-gray-400'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.classGrade}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{student.ecoPoints}</p>
                  <p className="text-xs text-gray-500">Eco Points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Distribution */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Student Distribution by Class</CardTitle>
          <CardDescription>Number of students in each grade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from(new Set(students.map(s => s.classGrade)))
              .sort()
              .map(grade => {
                const count = students.filter(s => s.classGrade === grade).length;
                return (
                  <div key={grade} className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{count}</p>
                    <p className="text-sm text-gray-600">{grade}</p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Teacher & Student Management */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Manage Teachers & Students</CardTitle>
          <CardDescription>
            Approve new teacher accounts and manage all users in your school/college.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Pending teacher approvals */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Pending Teacher Approvals ({pendingTeachers.length})</h3>
            {pendingTeachers.length === 0 ? (
              <p className="text-sm text-gray-500">No pending teacher accounts.</p>
            ) : (
              <div className="space-y-3">
                {pendingTeachers.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg bg-yellow-50"
                  >
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-gray-600">{t.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Requested on {new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveTeacher(t.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(t.id)}
                      >
                        Reject & Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active teachers */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Teachers ({activeTeachers.length})</h3>
            {activeTeachers.length === 0 ? (
              <p className="text-sm text-gray-500">No active teachers found.</p>
            ) : (
              <div className="space-y-2">
                {activeTeachers.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-gray-600">{t.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisableTeacher(t.id)}
                      >
                        Disable
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(t.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Students */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Students ({students.length})</h3>
            {students.length === 0 ? (
              <p className="text-sm text-gray-500">No students found for your school.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-white border"
                  >
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-gray-600">{s.email}</p>
                      <p className="text-xs text-gray-500">
                        Class: {s.classGrade || 'N/A'} • Eco Points: {s.ecoPoints}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(s.id)}
                    >
                      Remove Student
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}