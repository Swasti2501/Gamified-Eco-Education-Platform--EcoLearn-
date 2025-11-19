import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers } from '@/lib/storage';
import { verifyPassword } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const users = await getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Check if user has a password (for backward compatibility)
      if (!user.password) {
        setError('Please reset your password or contact support');
        setIsLoading(false);
        return;
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      const status = user.status ?? 'active';
      const isSuperAdmin = user.role === 'super_admin';

      if (status === 'disabled') {
        setError('Your account has been disabled. Please contact your school admin or super admin.');
        setIsLoading(false);
        return;
      }

      login(user);
      toast.success(`Welcome back, ${user.name}!`);

      if (status === 'pending' && !isSuperAdmin) {
        toast.info('Your account is pending approval.');
        navigate('/pending-approval');
        return;
      }

      // Navigate based on role
      switch (user.role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'teacher':
          navigate('/teacher-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'super_admin':
          navigate('/super-admin');
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Login to continue your eco journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

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
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="text-green-600 p-0"
                onClick={() => navigate('/register')}
              >
                Register here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}