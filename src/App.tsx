import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Navbar from '@/components/Navbar';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PendingApproval from './pages/PendingApproval';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Quizzes from './pages/Quizzes';
import QuizDetail from './pages/QuizDetail';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
  allowPending,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowPending?: boolean;
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const isPending = (user?.status ?? 'active') === 'pending';
  const isSuperAdmin = user?.role === 'super_admin';

  if (isPending && !allowPending && !isSuperAdmin) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/pending-approval"
          element={
            <ProtectedRoute allowPending>
              <PendingApproval />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ErrorBoundary>
                <TeacherDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <ErrorBoundary>
                <SuperAdminDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Lessons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <LessonDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Quizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <QuizDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Challenges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;