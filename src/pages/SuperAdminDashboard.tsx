import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllUsers,
  getAdminCodes,
  createAdminCodeForSchool,
  AdminCode,
  updateUserStatus,
  deleteUser,
  logActivity,
  getActivityLogs,
  ActivityLogEntry,
} from '@/lib/storage';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Users, School, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PLATFORM_SCHOOL_NAME, getRoleLabel } from '@/lib/userConstants';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [schoolNameInput, setSchoolNameInput] = useState('');

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const users = await getAllUsers().catch((err) => {
        console.error('Error getting users:', err);
        return [];
      });
      setAllUsers(users || []);
      setCodes(getAdminCodes());
      setActivityLogs(getActivityLogs(50));
    } catch (error) {
      console.error('Error loading super admin data:', error);
      toast.error('Failed to load data. Please try refreshing.');
      setAllUsers([]);
      setCodes([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const recordAction = (action: string, target?: User | null, details?: string) => {
    if (!user) return;
    try {
      logActivity({
        action,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetUserId: target?.id,
        targetUserName: target?.name,
        details,
      });
    } catch (error) {
      console.error('Failed to record activity', error);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p>Please log in to view this dashboard.</p>
      </div>
    );
  }

  const superAdmins = allUsers.filter((u) => u.role === 'super_admin');
  const institutionUsers = allUsers.filter((u) => u.role !== 'super_admin');
  const admins = institutionUsers.filter((u) => u.role === 'admin');
  const teachers = institutionUsers.filter((u) => u.role === 'teacher');
  const students = institutionUsers.filter((u) => u.role === 'student');

  const schools = Array.from(
    new Map(
      institutionUsers.map((u) => [
        u.schoolId,
        {
          schoolId: u.schoolId,
          schoolName: u.schoolName,
        },
      ])
    ).values()
  ).filter((s) => s.schoolId && s.schoolName);

  const handleManualRefresh = () => {
    loadData(false);
    toast.success('Data refreshed');
  };

  const handleGenerateCode = () => {
    if (!schoolNameInput.trim()) {
      toast.error('Please enter a school/college name');
      return;
    }
    const code = createAdminCodeForSchool(schoolNameInput.trim());
    setCodes(getAdminCodes());
    recordAction('generate_admin_code', null, `Code ${code.code} for ${code.schoolName}`);
    toast.success(`Admin code generated for ${code.schoolName}`);
    setSchoolNameInput('');
  };

  const handleDisableUser = async (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target?.role === 'super_admin') {
      toast.error('Super admin accounts cannot be disabled.');
      return;
    }
    if (!confirm('Are you sure you want to disable this account?')) return;
    try {
      await updateUserStatus(userId, 'disabled');
      recordAction('disable_user', target || null, 'Disabled account');
      toast.success('User disabled successfully');
      await loadData(false);
    } catch (error) {
      console.error('Error disabling user', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disable user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target?.role === 'super_admin') {
      toast.error('Super admin accounts cannot be deleted.');
      return;
    }
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await deleteUser(userId);
      recordAction('delete_user', target || null, 'Deleted user');
      toast.success('User deleted successfully');
      await loadData(false);
    } catch (error) {
      console.error('Error deleting user', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target?.role === 'super_admin') {
      toast.info('Super admin accounts are always active.');
      return;
    }
    try {
      await updateUserStatus(userId, 'active');
      recordAction('activate_user', target || null, 'Activated account');
      toast.success('User activated');
      await loadData(false);
    } catch (error) {
      console.error('Error activating user', error);
      toast.error(error instanceof Error ? error.message : 'Failed to activate user');
    }
  };

  const directoryUsers = [...allUsers].sort((a, b) => a.name.localeCompare(b.name));

  const unusedCodes = codes.filter((c) => !c.isUsed);
  const usedCodes = codes.filter((c) => c.isUsed);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            EcoLearn App Administration
          </h1>
          <p className="text-gray-600">
            Platform-level controls for EcoLearn HQ admins to manage schools, institutions, and user access.
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

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading super admin dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* High-level stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">EcoLearn App Admins</p>
                    <p className="text-3xl font-bold">{superAdmins.length}</p>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Schools</p>
                    <p className="text-3xl font-bold text-gray-900">{schools.length}</p>
                  </div>
                  <School className="h-10 w-10 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Admins</p>
                    <p className="text-3xl font-bold text-gray-900">{admins.length}</p>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Teachers</p>
                    <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Students</p>
                    <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                  </div>
                  <Users className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin code management */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Admin Validation Codes</CardTitle>
              <CardDescription>
                Generate a unique 5-digit code for each school/college. Only one admin account can be
                created per code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">School / College Name</label>
                  <Input
                    placeholder="e.g., Green Valley High School"
                    value={schoolNameInput}
                    onChange={(e) => setSchoolNameInput(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If a code already exists and is unused for this school, it will be reused instead
                    of creating a new one.
                  </p>
                </div>
                <Button onClick={handleGenerateCode} className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Generate / Get Code
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Active Codes ({unusedCodes.length})</h3>
                  {unusedCodes.length === 0 ? (
                    <p className="text-sm text-gray-500">No active codes. Generate one above.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {unusedCodes.map((code) => (
                        <div
                          key={code.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-emerald-50"
                        >
                          <div>
                            <p className="font-semibold">{code.schoolName}</p>
                            <p className="text-xs text-gray-600">
                              Created: {new Date(code.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-mono font-bold">{code.code}</p>
                            <Badge variant="outline" className="mt-1">
                              Not used
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Used Codes ({usedCodes.length})</h3>
                  {usedCodes.length === 0 ? (
                    <p className="text-sm text-gray-500">No used codes yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {usedCodes.map((code) => (
                        <div
                          key={code.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div>
                            <p className="font-semibold">{code.schoolName}</p>
                            <p className="text-xs text-gray-600">
                              Used: {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-mono font-bold line-through text-gray-400">
                              {code.code}
                            </p>
                            <Badge variant="outline" className="mt-1 bg-gray-100 text-gray-700">
                              Used
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Global user directory */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Global User Directory</CardTitle>
              <CardDescription>
                Full visibility into every account. Super admins can activate, disable, or delete any
                user instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {directoryUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No users found.</p>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {directoryUsers.map((u) => {
                    const isPlatformAdmin = u.role === 'super_admin';
                    const displayRole = getRoleLabel(u.role);
                    const displaySchool = isPlatformAdmin ? PLATFORM_SCHOOL_NAME : u.schoolName;
                    return (
                    <div
                      key={u.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {u.name}
                          <Badge variant="outline" className="capitalize">
                            {displayRole}
                          </Badge>
                        </p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        <p className="text-xs text-gray-500">
                          {displaySchool} • Status:{' '}
                          <span className="capitalize font-semibold">{u.status ?? 'active'}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {u.status !== 'active' && (
                          <Button size="sm" onClick={() => handleActivateUser(u.id)}>
                            Activate
                          </Button>
                        )}
                        {u.status !== 'disabled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisableUser(u.id)}
                            disabled={isPlatformAdmin}
                          >
                            Disable
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={isPlatformAdmin}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>

          {/* School overview */}
          <Card>
            <CardHeader>
              <CardTitle>Schools Overview</CardTitle>
              <CardDescription>
                See how many admins, teachers, and students belong to each institution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schools.length === 0 ? (
                <p className="text-sm text-gray-500">No schools found.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {schools.map((s) => {
                    const schoolUsers = allUsers.filter((u) => u.schoolId === s.schoolId);
                    const schoolAdmins = schoolUsers.filter((u) => u.role === 'admin');
                    const schoolTeachers = schoolUsers.filter((u) => u.role === 'teacher');
                    const schoolStudents = schoolUsers.filter((u) => u.role === 'student');
                    return (
                      <div
                        key={s.schoolId}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-white border"
                      >
                        <div>
                          <p className="font-semibold">{s.schoolName}</p>
                          <p className="text-xs text-gray-500">ID: {s.schoolId}</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>
                            <span className="font-semibold">{schoolAdmins.length}</span> admins
                          </span>
                          <span>
                            <span className="font-semibold">{schoolTeachers.length}</span> teachers
                          </span>
                          <span>
                            <span className="font-semibold">{schoolStudents.length}</span> students
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Audit trail of approvals, deletions, and other sensitive actions (stored locally and
                compatible with Supabase deployments).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-gray-50">
                      <p className="text-sm font-semibold">
                        {log.actorName} ({log.actorRole.replace('_', ' ')}) &rarr; {log.action}
                      </p>
                      {log.targetUserName && (
                        <p className="text-xs text-gray-600">
                          Target: {log.targetUserName} ({log.targetUserId})
                        </p>
                      )}
                      {log.details && <p className="text-xs text-gray-500 mt-1">{log.details}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


