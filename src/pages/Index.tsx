import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, BookOpen, Trophy, Users, Target, Award } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      switch (user?.role) {
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
          navigate('/login');
      }
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-blue-50 to-green-100 py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex justify-center mb-6">
            <Leaf className="h-20 w-20 text-green-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            EcoLearn Platform
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Gamified Environmental Education for Schools and Colleges
          </p>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Learn about climate change, sustainability, and environmental protection through interactive lessons, 
            quizzes, and real-world challenges. Earn eco-points, unlock badges, and compete with peers!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-lg px-8 py-6"
            >
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Platform Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-green-500 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <BookOpen className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Interactive Lessons</h3>
                <p className="text-gray-600">
                  Engaging environmental education content covering climate change, waste management, 
                  water conservation, biodiversity, and renewable energy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <Trophy className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quizzes & Assessments</h3>
                <p className="text-gray-600">
                  Test your knowledge with interactive quizzes. Earn eco-points for correct answers 
                  and track your learning progress.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-World Challenges</h3>
                <p className="text-gray-600">
                  Complete practical environmental challenges like tree planting, waste segregation, 
                  and community clean-ups with photo verification.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-500 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <Award className="h-12 w-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Badges & Rewards</h3>
                <p className="text-gray-600">
                  Unlock digital badges for achievements. Progress through eco-warrior levels 
                  from Beginner to Legend as you earn points.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-red-500 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Leaderboards</h3>
                <p className="text-gray-600">
                  Compete with classmates and schools. Track your ranking and see who's 
                  making the biggest environmental impact.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-teal-500 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <Leaf className="h-12 w-12 text-teal-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Teacher Dashboard</h3>
                <p className="text-gray-600">
                  Teachers can monitor student progress, verify challenge submissions, 
                  and track class performance analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Making an Impact</h2>
          <p className="text-xl mb-8">
            Join thousands of students across India learning about environmental sustainability 
            and taking real action to protect our planet.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="text-5xl font-bold mb-2">5000+</div>
              <div className="text-lg">Active Students</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">200+</div>
              <div className="text-lg">Schools Enrolled</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-lg">Trees Planted</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Ready to Start Your Eco Journey?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join EcoLearn today and become an environmental champion. Learn, act, and inspire change!
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-green-600 hover:bg-green-700 text-lg px-12 py-6"
          >
            Join Now - It's Free!
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © 2025 EcoLearn Platform. Empowering environmental education across India.
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            Aligned with NEP 2020 and India's SDG goals
          </p>
        </div>
      </footer>
    </div>
  );
}