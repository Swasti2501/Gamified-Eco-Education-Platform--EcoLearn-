import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleLabel = user.role === 'teacher' ? 'Teacher' : 'Account';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-yellow-50 to-orange-50">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">{roleLabel} Awaiting Approval</CardTitle>
          <CardDescription>
            Hi {user.name}, your account is pending approval from your school administrator. You will
            receive full access once they approve your request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              Current status: <span className="font-semibold capitalize">{user.status}</span>
            </p>
            <p>
              If you believe this is taking too long, please contact your school/college
              administrator.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              variant="outline"
            >
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

