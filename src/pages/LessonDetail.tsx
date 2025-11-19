import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getLessonById, markLessonComplete, updateUserPoints, addBadgeToUser } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Award, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Lesson } from '@/types';

export default function LessonDetail() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | undefined>(undefined);

  useEffect(() => {
    if (id) {
      setLesson(getLessonById(id));
    }
  }, [id]);

  if (!user) return null;
  
  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
        <Button onClick={() => navigate('/lessons')}>Back to Lessons</Button>
      </div>
    );
  }

  const isCompleted = user.completedLessons.includes(lesson.id);

  const handleComplete = () => {
    if (!isCompleted) {
      markLessonComplete(user.id, lesson.id);
      updateUserPoints(user.id, lesson.ecoPoints);
      
      // Check for first lesson badge
      if (user.completedLessons.length === 0) {
        addBadgeToUser(user.id, 'first-lesson');
        toast.success('🎉 Badge Unlocked: First Steps!');
      }
      
      // Check for lesson master badge
      if (user.completedLessons.length + 1 >= 5) {
        addBadgeToUser(user.id, 'lesson-master');
        toast.success('🎉 Badge Unlocked: Knowledge Seeker!');
      }

      const updatedUser = {
        ...user,
        completedLessons: [...user.completedLessons, lesson.id],
        ecoPoints: user.ecoPoints + lesson.ecoPoints,
      };
      updateUser(updatedUser);
      
      toast.success(`Lesson completed! +${lesson.ecoPoints} Eco Points`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/lessons')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Lessons
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-blue-100 text-blue-800">{lesson.topic}</Badge>
            <Badge className="bg-purple-100 text-purple-800 capitalize">{lesson.difficulty}</Badge>
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{lesson.title}</h1>
          
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{lesson.duration} minutes</span>
            </div>
            <div className="flex items-center text-green-600 font-semibold">
              <Award className="h-4 w-4 mr-2" />
              <span>{lesson.ecoPoints} Eco Points</span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none mb-8">
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleComplete}
              disabled={isCompleted}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isCompleted ? 'Lesson Completed ✓' : 'Mark as Complete'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/lessons')}
              className="flex-1"
            >
              Back to Lessons
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}