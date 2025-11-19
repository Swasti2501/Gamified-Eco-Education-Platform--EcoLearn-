import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAllQuizzes, getQuizById, markQuizComplete, updateUserPoints, addBadgeToUser } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Quiz } from '@/types';

export default function QuizDetail() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (id) {
      setQuiz(getQuizById(id));
    }
  }, [id]);

  if (!user) return null;
  
  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Quiz not found</h1>
        <Button onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const correctAnswers = selectedAnswers.filter(
      (answer, index) => answer === quiz.questions[index].correctAnswer
    ).length;
    
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    if (passed && !user.completedQuizzes.includes(quiz.id)) {
      markQuizComplete(user.id, quiz.id);
      updateUserPoints(user.id, quiz.ecoPoints);
      
      // Check for quiz master badge (3 quizzes with 80%+)
      const quizzesWithHighScore = user.completedQuizzes.length + 1;
      if (quizzesWithHighScore >= 3 && score >= 80) {
        addBadgeToUser(user.id, 'quiz-master');
        toast.success('🎉 Badge Unlocked: Quiz Champion!');
      }

      const updatedUser = {
        ...user,
        completedQuizzes: [...user.completedQuizzes, quiz.id],
        ecoPoints: user.ecoPoints + quiz.ecoPoints,
      };
      updateUser(updatedUser);
      
      toast.success(`Quiz passed! +${quiz.ecoPoints} Eco Points`);
    } else if (!passed) {
      toast.error(`Score: ${score}%. You need ${quiz.passingScore}% to pass. Try again!`);
    }

    setShowResults(true);
  };

  if (showResults) {
    const correctAnswers = selectedAnswers.filter(
      (answer, index) => answer === quiz.questions[index].correctAnswer
    ).length;
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <div className={`text-6xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {score}%
              </div>
              <p className="text-xl mb-2">
                {correctAnswers} out of {quiz.questions.length} correct
              </p>
              <p className="text-gray-600">
                {passed ? '🎉 Congratulations! You passed!' : '😔 Keep learning and try again!'}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {quiz.questions.map((q, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === q.correctAnswer;
                
                return (
                  <Card key={q.id} className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold mb-2">{q.question}</p>
                          <p className="text-sm text-gray-600 mb-1">
                            Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {q.options[userAnswer]}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-gray-600 mb-2">
                              Correct answer: <span className="text-green-600">{q.options[q.correctAnswer]}</span>
                            </p>
                          )}
                          <p className="text-sm text-gray-500 italic">{q.explanation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate('/quizzes')} className="flex-1" variant="outline">
                Back to Quizzes
              </Button>
              <Button
                onClick={() => {
                  setCurrentQuestion(0);
                  setSelectedAnswers([]);
                  setShowResults(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/quizzes')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Quizzes
      </Button>

      <Card>
        <CardHeader>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>
          <CardTitle className="text-2xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedAnswers[currentQuestion]?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          >
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {currentQuestion === quiz.questions.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}