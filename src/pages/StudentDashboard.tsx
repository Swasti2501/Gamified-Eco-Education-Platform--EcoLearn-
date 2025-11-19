import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getAllLessons, getAllQuizzes, getAllChallenges } from '@/lib/storage';
import { BADGES } from '@/lib/sampleData';
import { BookOpen, Trophy, Target, Award, TrendingUp, Zap } from 'lucide-react';
import { getPointsToNextLevel, getLevelName, ECO_LEVELS } from '@/types';
import { useState, useEffect } from 'react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);

  useEffect(() => {
    setTotalLessons(getAllLessons().length);
    setTotalQuizzes(getAllQuizzes().length);
    setTotalChallenges(getAllChallenges().length);
  }, []);

  if (!user) return null;

  const completedLessonsCount = user.completedLessons.length;
  const completedQuizzesCount = user.completedQuizzes.length;
  const completedChallengesCount = user.completedChallenges.length;
  const badgesCount = user.badges.length;

  const pointsToNext = getPointsToNextLevel(user.ecoPoints);
  const currentLevelData = ECO_LEVELS.find(l => l.level === user.level);
  const nextLevelData = ECO_LEVELS.find(l => l.level === user.level + 1);
  
  const progressToNextLevel = nextLevelData 
    ? ((user.ecoPoints - currentLevelData!.minPoints) / (nextLevelData.minPoints - currentLevelData!.minPoints)) * 100
    : 100;

  const recentBadges = BADGES.filter(b => user.badges.includes(b.id)).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 🌱
        </h1>
        <p className="text-gray-600">
          {user.schoolName} • {user.classGrade}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Eco Points</p>
                <p className="text-3xl font-bold">{user.ecoPoints}</p>
              </div>
              <Zap className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Current Level</p>
                <p className="text-2xl font-bold">{getLevelName(user.level)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Badges Earned</p>
                <p className="text-3xl font-bold">{badgesCount}</p>
              </div>
              <Award className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Challenges Done</p>
                <p className="text-3xl font-bold">{completedChallengesCount}</p>
              </div>
              <Target className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
          <CardDescription>
            {pointsToNext > 0 
              ? `${pointsToNext} points to reach ${nextLevelData?.name}`
              : 'Maximum level reached! 🎉'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressToNextLevel} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Level {user.level}</span>
            {nextLevelData && <span>Level {user.level + 1}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/lessons')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <BookOpen className="h-8 w-8 text-green-600" />
              <Badge variant="secondary">{completedLessonsCount}/{totalLessons}</Badge>
            </div>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Explore environmental lessons</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(completedLessonsCount / totalLessons) * 100} className="mb-2" />
            <Button className="w-full bg-green-600 hover:bg-green-700">
              View Lessons
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/quizzes')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Trophy className="h-8 w-8 text-blue-600" />
              <Badge variant="secondary">{completedQuizzesCount}/{totalQuizzes}</Badge>
            </div>
            <CardTitle>Take Quizzes</CardTitle>
            <CardDescription>Test your knowledge</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(completedQuizzesCount / totalQuizzes) * 100} className="mb-2" />
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Start Quiz
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/challenges')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-purple-600" />
              <Badge variant="secondary">{completedChallengesCount}/{totalChallenges}</Badge>
            </div>
            <CardTitle>Take Challenges</CardTitle>
            <CardDescription>Real-world environmental action</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(completedChallengesCount / totalChallenges) * 100} className="mb-2" />
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Challenges
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Badges</CardTitle>
            <CardDescription>Your latest achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentBadges.map(badge => (
                <div key={badge.id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/profile')}
            >
              View All Badges
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}