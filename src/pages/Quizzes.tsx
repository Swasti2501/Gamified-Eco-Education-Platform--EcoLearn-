import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllQuizzes, getAllLessons } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, CheckCircle, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Quiz, Lesson } from '@/types';

export default function Quizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    setQuizzes(getAllQuizzes());
    setLessons(getAllLessons());
  }, []);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Environmental Quizzes
        </h1>
        <p className="text-gray-600">
          Test your knowledge and earn eco-points
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map(quiz => {
          const isCompleted = user.completedQuizzes.includes(quiz.id);
          const lesson = lessons.find(l => l.id === quiz.lessonId);
          
          return (
            <Card
              key={quiz.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${
                isCompleted ? 'border-blue-500 border-2' : ''
              }`}
              onClick={() => navigate(`/quizzes/${quiz.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {lesson?.topic || 'Quiz'}
                  </Badge>
                  {isCompleted && (
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <CardTitle className="text-xl">{quiz.title}</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    <span>{quiz.questions.length} Questions</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>Passing Score: {quiz.passingScore}%</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600 font-semibold">
                    <Award className="h-4 w-4 mr-2" />
                    <span>{quiz.ecoPoints} Eco Points</span>
                  </div>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                    {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}