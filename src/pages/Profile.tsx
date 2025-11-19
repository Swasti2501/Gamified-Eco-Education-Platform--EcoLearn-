import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BADGES } from '@/lib/sampleData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, Trophy, Target, TrendingUp, User, Lock, Camera } from 'lucide-react';
import { getPointsToNextLevel, getLevelName, ECO_LEVELS } from '@/types';
import { saveUser } from '@/lib/storage';
import { hashPassword, verifyPassword } from '@/lib/utils';
import { toast } from 'sonner';
import { getRoleLabel, PLATFORM_SCHOOL_ID, PLATFORM_SCHOOL_NAME } from '@/lib/userConstants';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [infoForm, setInfoForm] = useState({
    name: user?.name ?? '',
    schoolName: user?.role === 'super_admin' ? PLATFORM_SCHOOL_NAME : (user?.schoolName ?? ''),
    classGrade: user?.classGrade ?? '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [infoLoading, setInfoLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [activeTab, setActiveTab] = useState<'photo' | 'info' | 'password'>('photo');

  if (!user) return null;

  const roleLabel = getRoleLabel(user.role);
  const displaySchool = user.role === 'super_admin' ? PLATFORM_SCHOOL_NAME : (user.schoolName || '—');

  useEffect(() => {
    setInfoForm({
      name: user.name,
      schoolName: user.role === 'super_admin' ? PLATFORM_SCHOOL_NAME : (user.schoolName ?? ''),
      classGrade: user.classGrade ?? '',
    });
  }, [user]);

  const userBadges = BADGES.filter(b => user.badges.includes(b.id));
  const allBadges = BADGES;
  
  const pointsToNext = getPointsToNextLevel(user.ecoPoints);
  const currentLevelData = ECO_LEVELS.find(l => l.level === user.level);
  const nextLevelData = ECO_LEVELS.find(l => l.level === user.level + 1);
  
  const progressToNextLevel = nextLevelData 
    ? ((user.ecoPoints - currentLevelData!.minPoints) / (nextLevelData.minPoints - currentLevelData!.minPoints)) * 100
    : 100;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInfoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInfoError('');

    if (!infoForm.name.trim()) {
      setInfoError('Name is required.');
      return;
    }

    if (user.role !== 'super_admin' && !infoForm.schoolName.trim()) {
      setInfoError('School / organization is required.');
      return;
    }

    if (user.role === 'student' && !infoForm.classGrade.trim()) {
      setInfoError('Class / grade is required for students.');
      return;
    }

    setInfoLoading(true);
    try {
      const updatedUser = {
        ...user,
        name: infoForm.name.trim(),
        schoolName: user.role === 'super_admin' ? PLATFORM_SCHOOL_NAME : infoForm.schoolName.trim(),
        schoolId: user.role === 'super_admin' ? PLATFORM_SCHOOL_ID : user.schoolId,
        classGrade: user.role === 'student' ? infoForm.classGrade.trim() : user.classGrade,
      };
      await saveUser(updatedUser);
      updateUser(updatedUser);
      toast.success('Profile information updated');
    } catch (error) {
      console.error('Failed to update profile info', error);
      toast.error('Unable to save profile changes. Please try again.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill out all password fields.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const isCurrentValid = await verifyPassword(passwordForm.currentPassword, user.password);
      if (!isCurrentValid) {
        setPasswordError('Current password is incorrect.');
        setPasswordLoading(false);
        return;
      }

      const hashed = await hashPassword(passwordForm.newPassword);
      const updatedUser = { ...user, password: hashed };
      await saveUser(updatedUser);
      updateUser(updatedUser);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Failed to update password', error);
      toast.error('Unable to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const convertFileToDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Please upload an image smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    setPhotoError('');
    setPhotoLoading(true);
    try {
      const dataUrl = await convertFileToDataUrl(file);
      const updatedUser = { ...user, avatarUrl: dataUrl };
      await saveUser(updatedUser);
      updateUser(updatedUser);
      toast.success('Profile photo updated');
    } catch (error) {
      console.error('Failed to update avatar', error);
      setPhotoError('Unable to update photo right now.');
    } finally {
      setPhotoLoading(false);
      event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user.avatarUrl) return;
    setPhotoError('');
    setPhotoLoading(true);
    try {
      const updatedUser = { ...user };
      delete updatedUser.avatarUrl;
      await saveUser(updatedUser);
      updateUser(updatedUser);
      toast.success('Profile photo removed');
    } catch (error) {
      console.error('Failed to remove avatar', error);
      setPhotoError('Unable to remove photo right now.');
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.name} profile photo`} />}
                  <AvatarFallback className="bg-green-100 text-green-700 text-3xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <Badge className="mb-4 bg-green-100 text-green-800">
                  {roleLabel}
                </Badge>
                
                <Separator className="my-4 w-full" />
                
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">School</span>
                    <span className="text-sm font-semibold">{displaySchool}</span>
                  </div>
                  {user.classGrade && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Class</span>
                      <span className="text-sm font-semibold">{user.classGrade}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Joined</span>
                    <span className="text-sm font-semibold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level Progress */}
          {user.role === 'student' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    Level {user.level}
                  </p>
                  <p className="text-sm text-gray-600">{getLevelName(user.level)}</p>
                </div>
                <Progress value={progressToNextLevel} className="h-3 mb-2" />
                <p className="text-xs text-center text-gray-600">
                  {pointsToNext > 0 
                    ? `${pointsToNext} points to ${nextLevelData?.name}`
                    : 'Maximum level reached! 🎉'}
                </p>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Stats and Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Overview */}
          {user.role === 'student' && (
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{user.ecoPoints}</p>
                  <p className="text-xs text-gray-600">Eco Points</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{user.completedLessons.length}</p>
                  <p className="text-xs text-gray-600">Lessons</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{user.completedQuizzes.length}</p>
                  <p className="text-xs text-gray-600">Quizzes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{user.completedChallenges.length}</p>
                  <p className="text-xs text-gray-600">Challenges</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Earned Badges */}
          {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Earned Badges ({userBadges.length}/{allBadges.length})
                </CardTitle>
                <CardDescription>Your achievements and accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                {userBadges.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Complete lessons, quizzes, and challenges to earn badges!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userBadges.map(badge => (
                      <div
                        key={badge.id}
                        className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200"
                      >
                        <div className="text-5xl mb-2">{badge.icon}</div>
                        <p className="font-semibold text-sm mb-1">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Available Badges */}
          {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle>Available Badges</CardTitle>
                <CardDescription>Badges you can unlock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allBadges
                    .filter(b => !user.badges.includes(b.id))
                    .map(badge => (
                      <div
                        key={badge.id}
                        className="text-center p-4 bg-gray-50 rounded-lg opacity-60"
                      >
                        <div className="text-5xl mb-2 grayscale">{badge.icon}</div>
                        <p className="font-semibold text-sm mb-1">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.requirement}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Account Settings - Full Width */}
      <Card className="mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Account Settings</CardTitle>
          <CardDescription>Manage your profile photo, personal information, and password.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row w-full border-t">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 shrink-0 bg-gray-50/50 border-b lg:border-b-0 lg:border-r p-6">
              <nav className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-x-visible">
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap lg:w-full ${
                    activeTab === 'photo'
                      ? 'bg-white text-green-700 shadow-sm border border-green-200'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <Camera className="h-4 w-4 flex-shrink-0" />
                  <span>Profile Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap lg:w-full ${
                    activeTab === 'info'
                      ? 'bg-white text-green-700 shadow-sm border border-green-200'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>Personal Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('password')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap lg:w-full ${
                    activeTab === 'password'
                      ? 'bg-white text-green-700 shadow-sm border border-green-200'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span>Password</span>
                </button>
              </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 w-full p-6 lg:p-8 overflow-y-auto">
              {/* Profile Photo Tab */}
              {activeTab === 'photo' && (
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0 pb-6">
                    <CardTitle className="text-xl">Profile Photo</CardTitle>
                    <CardDescription>
                      Upload a clear photo so your classmates and coordinators can recognize you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20 border-2 border-gray-200">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.name} profile photo`} />}
                        <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={photoLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {user.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                          </Button>
                          {user.avatarUrl && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleRemovePhoto} 
                              disabled={photoLoading}
                            >
                              Remove Photo
                            </Button>
                          )}
                        </div>
                        {photoLoading && (
                          <span className="text-sm text-gray-500">Saving...</span>
                        )}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    {photoError && (
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{photoError}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, SVG (max 2 MB).
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Personal Information Tab */}
              {activeTab === 'info' && (
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0 pb-6">
                    <CardTitle className="text-xl">Personal Information</CardTitle>
                    <CardDescription>
                      Update your display name and other personal details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={handleInfoSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="profile-name" className="text-sm font-medium">
                            Full Name
                          </Label>
                          <Input
                            id="profile-name"
                            value={infoForm.name}
                            onChange={(e) => setInfoForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-email" className="text-sm font-medium">
                            Email
                          </Label>
                          <Input 
                            id="profile-email" 
                            value={user.email} 
                            disabled 
                            className="bg-gray-50 h-10"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Email updates are handled by the EcoLearn team.
                          </p>
                        </div>
                      </div>

                      {user.role !== 'super_admin' && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-school" className="text-sm font-medium">
                            School / College / Organization
                          </Label>
                          <Input
                            id="profile-school"
                            value={infoForm.schoolName}
                            onChange={(e) => setInfoForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                      )}

                      {user.role === 'student' && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-class" className="text-sm font-medium">
                            Class / Grade
                          </Label>
                          <Input
                            id="profile-class"
                            value={infoForm.classGrade}
                            onChange={(e) => setInfoForm((prev) => ({ ...prev, classGrade: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                      )}

                      {infoError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                          {infoError}
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit" 
                          disabled={infoLoading}
                          className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                        >
                          {infoLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0 pb-6">
                    <CardTitle className="text-xl">Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-sm font-medium">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          className="h-10"
                          placeholder="Enter your current password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-sm font-medium">
                          New Password
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          className="h-10"
                          placeholder="Enter your new password"
                        />
                        <p className="text-xs text-gray-500">
                          Password must be at least 6 characters long.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-sm font-medium">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          className="h-10"
                          placeholder="Confirm your new password"
                        />
                      </div>

                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                          {passwordError}
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit" 
                          variant="outline"
                          disabled={passwordLoading}
                          className="min-w-[140px]"
                        >
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </main>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}