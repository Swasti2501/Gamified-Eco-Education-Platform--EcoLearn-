import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllLessons } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Award, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Lesson } from '@/types';

export default function Lessons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    setLessons(getAllLessons());
  }, []);

  if (!user) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Environmental Lessons
        </h1>
        <p className="text-gray-600">
          Learn about climate change, sustainability, and environmental protection
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map(lesson => {
          const isCompleted = user.completedLessons.includes(lesson.id);
          
          return (
            <Card
              key={lesson.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${
                isCompleted ? 'border-green-500 border-2' : ''
              }`}
              onClick={() => navigate(`/lessons/${lesson.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getDifficultyColor(lesson.difficulty)}>
                    {lesson.difficulty}
                  </Badge>
                  {isCompleted && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                <CardDescription>{lesson.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>{lesson.topic}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{lesson.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-sm text-green-600 font-semibold">
                    <Award className="h-4 w-4 mr-2" />
                    <span>{lesson.ecoPoints} Eco Points</span>
                  </div>
                  <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                    {isCompleted ? 'Review Lesson' : 'Start Learning'}
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