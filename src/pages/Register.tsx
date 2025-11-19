import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { saveUser, getAllUsers, getAdminCodeByCode, markAdminCodeUsed } from '@/lib/storage';
import { hashPassword } from '@/lib/utils';
import { User, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [schoolName, setSchoolName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name || !email || !password || !schoolName) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (role === 'student' && !classGrade) {
      setError('Please select your class/grade');
      setIsLoading(false);
      return;
    }

    if (role === 'admin' && !adminCode) {
      setError('Please enter the 5-digit admin code provided by the super admin');
      setIsLoading(false);
      return;
    }

    // Check if email already exists
    const users = await getAllUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setError('An account with this email already exists');
      setIsLoading(false);
      return;
    }

    try {
      // Admin-specific: validate single-use 5 digit code and school
      let finalSchoolId = '';
      let finalSchoolName = schoolName;

      if (role === 'admin') {
        const codeRecord = getAdminCodeByCode(adminCode.trim());
        if (!codeRecord) {
          setError('Invalid admin code. Please contact the super admin.');
          setIsLoading(false);
          return;
        }
        if (codeRecord.isUsed) {
          setError('This admin code has already been used. Only one admin account is allowed per school.');
          setIsLoading(false);
          return;
        }

        // School name must match the code's school
        if (codeRecord.schoolName.toLowerCase() !== schoolName.trim().toLowerCase()) {
          setError(`School name does not match this admin code. Expected: ${codeRecord.schoolName}`);
          setIsLoading(false);
          return;
        }

        // Ensure no other admin exists for this school
        const existingAdminForSchool = users.find(
          (u) =>
            u.role === 'admin' &&
            (u.schoolId === codeRecord.schoolId ||
              u.schoolName.toLowerCase() === codeRecord.schoolName.toLowerCase())
        );
        if (existingAdminForSchool) {
          setError('An admin account already exists for this school.');
          setIsLoading(false);
          return;
        }

        finalSchoolId = codeRecord.schoolId;
        finalSchoolName = codeRecord.schoolName;
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Find existing school with same name to assign same schoolId
      const existingUsers = await getAllUsers();
      const existingSchool = existingUsers.find(u => 
        u.schoolName.toLowerCase() === schoolName.toLowerCase()
      );
      
      // Use existing schoolId if school exists, otherwise create new one
      const schoolId = role === 'admin'
        ? finalSchoolId
        : existingSchool 
          ? existingSchool.schoolId 
          : `school-${Date.now()}-${schoolName.toLowerCase().replace(/\s+/g, '-')}`;

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: hashedPassword,
        role,
        schoolId,
        schoolName: role === 'admin' ? finalSchoolName : schoolName,
        classGrade: role === 'student' ? classGrade : undefined,
        status: role === 'teacher' ? 'pending' : 'active',
        ecoPoints: 0,
        level: 1,
        badges: [],
        completedLessons: [],
        completedQuizzes: [],
        completedChallenges: [],
        createdAt: new Date().toISOString(),
      };

      await saveUser(newUser);

      // Mark admin code as used after successful admin creation
      if (role === 'admin') {
        markAdminCodeUsed(adminCode.trim());
      }
      login(newUser);
      toast.success('Account created successfully! Welcome to EcoLearn!');

      // Navigate based on role
      switch (role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'teacher':
          navigate('/teacher-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Leaf className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join EcoLearn and start your environmental journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I am a *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher / Coordinator</SelectItem>
                  <SelectItem value="admin">School Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="adminCode">Admin Verification Code *</Label>
                <Input
                  id="adminCode"
                  placeholder="Enter the 5-digit code from your super admin"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  maxLength={5}
                />
                <p className="text-xs text-gray-500">
                  This code is unique for your school/college and can be used only once to create the admin account.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="school">School / College Name *</Label>
              <Input
                id="school"
                placeholder="Enter your institution name"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
            </div>

            {role === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="class">Class / Grade *</Label>
                <Select value={classGrade} onValueChange={setClassGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6th Grade">6th Grade</SelectItem>
                    <SelectItem value="7th Grade">7th Grade</SelectItem>
                    <SelectItem value="8th Grade">8th Grade</SelectItem>
                    <SelectItem value="9th Grade">9th Grade</SelectItem>
                    <SelectItem value="10th Grade">10th Grade</SelectItem>
                    <SelectItem value="11th Grade">11th Grade</SelectItem>
                    <SelectItem value="12th Grade">12th Grade</SelectItem>
                    <SelectItem value="College 1st Year">College 1st Year</SelectItem>
                    <SelectItem value="College 2nd Year">College 2nd Year</SelectItem>
                    <SelectItem value="College 3rd Year">College 3rd Year</SelectItem>
                    <SelectItem value="College 4th Year">College 4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Button
                variant="link"
                className="text-green-600 p-0"
                onClick={() => navigate('/login')}
              >
                Login here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}