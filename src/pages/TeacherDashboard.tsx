import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, getAllSubmissions, updateSubmissionStatus, getAllLessons, getAllQuizzes, getAllChallenges, saveLesson, saveQuiz, saveChallenge, deleteLesson, deleteQuiz, deleteChallenge } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CheckCircle, Clock, XCircle, TrendingUp, RefreshCw, BookOpen, Trophy, Target, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { User, ChallengeSubmission, Lesson, Quiz, Challenge, Question } from '@/types';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Content management state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState('submissions');
  
  // Lesson form state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState<Partial<Lesson>>({
    title: '',
    topic: '',
    description: '',
    content: '',
    imageUrl: '',
    duration: 15,
    difficulty: 'beginner',
    ecoPoints: 50,
  });
  
  // Quiz form state
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<Partial<Quiz>>({
    title: '',
    lessonId: '',
    description: '',
    passingScore: 70,
    ecoPoints: 30,
    questions: [],
  });
  
  // Challenge form state
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeForm, setChallengeForm] = useState<Partial<Challenge>>({
    title: '',
    description: '',
    category: '',
    difficulty: 'easy',
    ecoPoints: 100,
    duration: 7,
    instructions: [],
    verificationRequired: true,
    imageUrl: '',
  });

  const loadData = useCallback(async (showLoading = true) => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const allUsers = await getAllUsers().catch(err => {
        console.error('Error getting users:', err);
        return [];
      });
      const allSubmissions = await getAllSubmissions().catch(err => {
        console.error('Error getting submissions:', err);
        return [];
      });
      
      // Filter by schoolId (case-insensitive match for school name)
      const schoolStudents = (allUsers || []).filter(u => 
        u.role === 'student' && 
        (u.schoolId === user?.schoolId || (u.schoolName?.toLowerCase() === user?.schoolName?.toLowerCase()))
      );
      const schoolSubmissions = (allSubmissions || []).filter(s => 
        schoolStudents.some(student => student.id === s.userId)
      );
      
      setStudents(schoolStudents);
      setSubmissions(schoolSubmissions);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data. Please try refreshing.');
      // Set empty arrays on error so component still renders
      setStudents([]);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  const loadContent = useCallback(() => {
    setLessons(getAllLessons());
    setQuizzes(getAllQuizzes());
    setChallenges(getAllChallenges());
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;
    
    const fetchData = async () => {
      if (!mounted) return;
      try {
        const allUsers = await getAllUsers().catch(err => {
          console.error('Error getting users:', err);
          return [];
        });
        const allSubmissions = await getAllSubmissions().catch(err => {
          console.error('Error getting submissions:', err);
          return [];
        });
        
        if (!mounted) return;
        
        // Filter by schoolId (case-insensitive match for school name)
        const schoolStudents = (allUsers || []).filter(u => 
          u.role === 'student' && 
          (u.schoolId === user?.schoolId || (u.schoolName?.toLowerCase() === user?.schoolName?.toLowerCase()))
        );
        const schoolSubmissions = (allSubmissions || []).filter(s => 
          schoolStudents.some(student => student.id === s.userId)
        );
        
        setStudents(schoolStudents);
        setSubmissions(schoolSubmissions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in useEffect:', error);
        if (mounted) {
          setStudents([]);
          setSubmissions([]);
          setIsLoading(false);
        }
      }
    };
    
    setIsLoading(true);
    fetchData();
    
    // Auto-refresh every 30 seconds
    interval = setInterval(() => {
      if (mounted) {
        fetchData();
      }
    }, 30000);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, user?.schoolId, user?.schoolName]); // Depend on specific user properties

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const allUsers = await getAllUsers().catch(err => {
        console.error('Error getting users:', err);
        return [];
      });
      const allSubmissions = await getAllSubmissions().catch(err => {
        console.error('Error getting submissions:', err);
        return [];
      });
      
      // Filter by schoolId (case-insensitive match for school name)
      const schoolStudents = (allUsers || []).filter(u => 
        u.role === 'student' && 
        (u.schoolId === user?.schoolId || (u.schoolName?.toLowerCase() === user?.schoolName?.toLowerCase()))
      );
      const schoolSubmissions = (allSubmissions || []).filter(s => 
        schoolStudents.some(student => student.id === s.userId)
      );
      
      setStudents(schoolStudents);
      setSubmissions(schoolSubmissions);
      toast.success('Data refreshed');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingSubmissions = (submissions || []).filter(s => s.status === 'pending');
  const approvedSubmissions = (submissions || []).filter(s => s.status === 'approved');
  const rejectedSubmissions = (submissions || []).filter(s => s.status === 'rejected');

  const totalEcoPoints = (students || []).reduce((sum, s) => sum + (s.ecoPoints || 0), 0);
  const avgEcoPoints = (students || []).length > 0 ? Math.round(totalEcoPoints / students.length) : 0;

  const handleApprove = async (submissionId: string) => {
    try {
      await updateSubmissionStatus(submissionId, 'approved', user.id);
      toast.success('Challenge submission approved!');
      loadData(false); // Refresh data immediately
    } catch (error) {
      toast.error('Failed to approve submission');
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      await updateSubmissionStatus(submissionId, 'rejected', user.id);
      toast.error('Challenge submission rejected');
      loadData(false); // Refresh data immediately
    } catch (error) {
      toast.error('Failed to reject submission');
    }
  };

  // Lesson Management Functions
  const handleSaveLesson = () => {
    if (!lessonForm.title || !lessonForm.topic || !lessonForm.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const lesson: Lesson = {
      id: editingLesson?.id || `lesson-${Date.now()}`,
      title: lessonForm.title!,
      topic: lessonForm.topic!,
      description: lessonForm.description || '',
      content: lessonForm.content!,
      imageUrl: lessonForm.imageUrl || '/images/default-lesson.jpg',
      duration: lessonForm.duration || 15,
      difficulty: lessonForm.difficulty || 'beginner',
      ecoPoints: lessonForm.ecoPoints || 50,
    };
    
    saveLesson(lesson);
    toast.success(editingLesson ? 'Lesson updated successfully' : 'Lesson created successfully');
    setLessonDialogOpen(false);
    resetLessonForm();
    loadContent();
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm(lesson);
    setLessonDialogOpen(true);
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      deleteLesson(lessonId);
      toast.success('Lesson deleted successfully');
      loadContent();
    }
  };

  const resetLessonForm = () => {
    setEditingLesson(null);
    setLessonForm({
      title: '',
      topic: '',
      description: '',
      content: '',
      imageUrl: '',
      duration: 15,
      difficulty: 'beginner',
      ecoPoints: 50,
    });
  };

  // Quiz Management Functions
  const handleSaveQuiz = () => {
    if (!quizForm.title || !quizForm.lessonId || !quizForm.questions || quizForm.questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question');
      return;
    }
    
    const quiz: Quiz = {
      id: editingQuiz?.id || `quiz-${Date.now()}`,
      title: quizForm.title!,
      lessonId: quizForm.lessonId!,
      description: quizForm.description || '',
      questions: quizForm.questions!,
      passingScore: quizForm.passingScore || 70,
      ecoPoints: quizForm.ecoPoints || 30,
    };
    
    saveQuiz(quiz);
    toast.success(editingQuiz ? 'Quiz updated successfully' : 'Quiz created successfully');
    setQuizDialogOpen(false);
    resetQuizForm();
    loadContent();
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm(quiz);
    setQuizDialogOpen(true);
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      deleteQuiz(quizId);
      toast.success('Quiz deleted successfully');
      loadContent();
    }
  };

  const resetQuizForm = () => {
    setEditingQuiz(null);
    setQuizForm({
      title: '',
      lessonId: '',
      description: '',
      passingScore: 70,
      ecoPoints: 30,
      questions: [],
    });
  };

  const addQuestionToQuiz = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    setQuizForm({
      ...quizForm,
      questions: [...(quizForm.questions || []), newQuestion],
    });
  };

  const updateQuizQuestion = (questionId: string, field: keyof Question, value: any) => {
    const questions = quizForm.questions?.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ) || [];
    setQuizForm({ ...quizForm, questions });
  };

  const removeQuizQuestion = (questionId: string) => {
    const questions = quizForm.questions?.filter(q => q.id !== questionId) || [];
    setQuizForm({ ...quizForm, questions });
  };

  // Challenge Management Functions
  const handleSaveChallenge = () => {
    if (!challengeForm.title || !challengeForm.description || !challengeForm.instructions || challengeForm.instructions.length === 0) {
      toast.error('Please fill in all required fields and add at least one instruction');
      return;
    }
    
    const challenge: Challenge = {
      id: editingChallenge?.id || `challenge-${Date.now()}`,
      title: challengeForm.title!,
      description: challengeForm.description!,
      category: challengeForm.category || 'Environment',
      difficulty: challengeForm.difficulty || 'easy',
      ecoPoints: challengeForm.ecoPoints || 100,
      duration: challengeForm.duration || 7,
      instructions: challengeForm.instructions!,
      verificationRequired: challengeForm.verificationRequired ?? true,
      imageUrl: challengeForm.imageUrl || '/images/default-challenge.jpg',
    };
    
    saveChallenge(challenge);
    toast.success(editingChallenge ? 'Challenge updated successfully' : 'Challenge created successfully');
    setChallengeDialogOpen(false);
    resetChallengeForm();
    loadContent();
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setChallengeForm(challenge);
    setChallengeDialogOpen(true);
  };

  const handleDeleteChallenge = (challengeId: string) => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      deleteChallenge(challengeId);
      toast.success('Challenge deleted successfully');
      loadContent();
    }
  };

  const resetChallengeForm = () => {
    setEditingChallenge(null);
    setChallengeForm({
      title: '',
      description: '',
      category: '',
      difficulty: 'easy',
      ecoPoints: 100,
      duration: 7,
      instructions: [],
      verificationRequired: true,
      imageUrl: '',
    });
  };

  const addChallengeInstruction = () => {
    setChallengeForm({
      ...challengeForm,
      instructions: [...(challengeForm.instructions || []), ''],
    });
  };

  const updateChallengeInstruction = (index: number, value: string) => {
    const instructions = [...(challengeForm.instructions || [])];
    instructions[index] = value;
    setChallengeForm({ ...challengeForm, instructions });
  };

  const removeChallengeInstruction = (index: number) => {
    const instructions = challengeForm.instructions?.filter((_, i) => i !== index) || [];
    setChallengeForm({ ...challengeForm, instructions });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600">
            {user?.schoolName || 'No school assigned'}
          </p>
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Reviews</p>
                <p className="text-3xl font-bold">{pendingSubmissions.length}</p>
              </div>
              <Clock className="h-12 w-12 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-3xl font-bold">{approvedSubmissions.length}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Eco Points</p>
                <p className="text-3xl font-bold">{avgEcoPoints}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Top Students */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Top Performing Students</CardTitle>
          <CardDescription>Students with highest eco-points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No students found in your school</p>
            ) : (
              students
                .sort((a, b) => (b.ecoPoints || 0) - (a.ecoPoints || 0))
                .slice(0, 5)
                .map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.classGrade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{student.ecoPoints || 0}</p>
                    <p className="text-xs text-gray-500">Eco Points</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Management */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>Review submissions and manage lessons, quizzes, and challenges</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="space-y-4">
              <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">
                    Pending ({pendingSubmissions.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({approvedSubmissions.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({rejectedSubmissions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingSubmissions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending submissions</p>
                  ) : (
                    pendingSubmissions.map(submission => (
                      <Card key={submission.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{submission.userName}</h3>
                              <p className="text-sm text-gray-600 mt-1">{submission.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(submission.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(submission.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4">
                  {approvedSubmissions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No approved submissions</p>
                  ) : (
                    approvedSubmissions.map(submission => (
                      <Card key={submission.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{submission.userName}</h3>
                              <p className="text-sm text-gray-600">{submission.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Approved: {submission.verifiedAt ? new Date(submission.verifiedAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                  {rejectedSubmissions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No rejected submissions</p>
                  ) : (
                    rejectedSubmissions.map(submission => (
                      <Card key={submission.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{submission.userName}</h3>
                              <p className="text-sm text-gray-600">{submission.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Rejected: {submission.verifiedAt ? new Date(submission.verifiedAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <Badge variant="destructive">Rejected</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Lessons ({lessons.length})</h3>
                <Dialog open={lessonDialogOpen} onOpenChange={(open) => {
                  setLessonDialogOpen(open);
                  if (!open) resetLessonForm();
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingLesson(null); resetLessonForm(); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Lesson
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
                      <DialogDescription>Fill in the lesson details below</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                          placeholder="Lesson title"
                        />
                      </div>
                      <div>
                        <Label>Topic *</Label>
                        <Input
                          value={lessonForm.topic}
                          onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
                          placeholder="e.g., Climate Change"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={lessonForm.description}
                          onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                          placeholder="Brief description"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Content * (Markdown supported)</Label>
                        <Textarea
                          value={lessonForm.content}
                          onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                          placeholder="Lesson content in Markdown format"
                          rows={10}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={lessonForm.duration}
                            onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 15 })}
                          />
                        </div>
                        <div>
                          <Label>Eco Points</Label>
                          <Input
                            type="number"
                            value={lessonForm.ecoPoints}
                            onChange={(e) => setLessonForm({ ...lessonForm, ecoPoints: parseInt(e.target.value) || 50 })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Difficulty</Label>
                          <Select
                            value={lessonForm.difficulty}
                            onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                              setLessonForm({ ...lessonForm, difficulty: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Image URL</Label>
                          <Input
                            value={lessonForm.imageUrl}
                            onChange={(e) => setLessonForm({ ...lessonForm, imageUrl: e.target.value })}
                            placeholder="/images/lesson.jpg"
                          />
                        </div>
                      </div>
                      <Button onClick={handleSaveLesson} className="w-full">
                        {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map(lesson => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      <CardDescription>{lesson.topic}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLesson(lesson)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Quizzes ({quizzes.length})</h3>
                <Dialog open={quizDialogOpen} onOpenChange={(open) => {
                  setQuizDialogOpen(open);
                  if (!open) resetQuizForm();
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingQuiz(null); resetQuizForm(); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
                      <DialogDescription>Fill in the quiz details below</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={quizForm.title}
                          onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                          placeholder="Quiz title"
                        />
                      </div>
                      <div>
                        <Label>Lesson *</Label>
                        <Select
                          value={quizForm.lessonId}
                          onValueChange={(value) => setQuizForm({ ...quizForm, lessonId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lesson" />
                          </SelectTrigger>
                          <SelectContent>
                            {lessons.map(lesson => (
                              <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={quizForm.description}
                          onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                          placeholder="Quiz description"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Passing Score (%)</Label>
                          <Input
                            type="number"
                            value={quizForm.passingScore}
                            onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 70 })}
                          />
                        </div>
                        <div>
                          <Label>Eco Points</Label>
                          <Input
                            type="number"
                            value={quizForm.ecoPoints}
                            onChange={(e) => setQuizForm({ ...quizForm, ecoPoints: parseInt(e.target.value) || 30 })}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Questions *</Label>
                          <Button type="button" size="sm" onClick={addQuestionToQuiz}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Question
                          </Button>
                        </div>
                        <div className="space-y-4 border rounded-lg p-4">
                          {quizForm.questions?.map((question, qIndex) => (
                            <div key={question.id} className="border-b pb-4 last:border-b-0">
                              <div className="space-y-2">
                                <Input
                                  placeholder="Question text"
                                  value={question.question}
                                  onChange={(e) => updateQuizQuestion(question.id, 'question', e.target.value)}
                                />
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex gap-2">
                                    <Input
                                      placeholder={`Option ${oIndex + 1}`}
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...question.options];
                                        newOptions[oIndex] = e.target.value;
                                        updateQuizQuestion(question.id, 'options', newOptions);
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={question.correctAnswer === oIndex ? 'default' : 'outline'}
                                      onClick={() => updateQuizQuestion(question.id, 'correctAnswer', oIndex)}
                                    >
                                      Correct
                                    </Button>
                                  </div>
                                ))}
                                <Input
                                  placeholder="Explanation"
                                  value={question.explanation}
                                  onChange={(e) => updateQuizQuestion(question.id, 'explanation', e.target.value)}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeQuizQuestion(question.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                          {(!quizForm.questions || quizForm.questions.length === 0) && (
                            <p className="text-center text-gray-500 py-4">No questions added yet</p>
                          )}
                        </div>
                      </div>
                      <Button onClick={handleSaveQuiz} className="w-full">
                        {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map(quiz => {
                  const lesson = lessons.find(l => l.id === quiz.lessonId);
                  return (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription>{lesson?.title || 'No lesson'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">{quiz.questions.length} questions</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditQuiz(quiz)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="challenges" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Challenges ({challenges.length})</h3>
                <Dialog open={challengeDialogOpen} onOpenChange={(open) => {
                  setChallengeDialogOpen(open);
                  if (!open) resetChallengeForm();
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingChallenge(null); resetChallengeForm(); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}</DialogTitle>
                      <DialogDescription>Fill in the challenge details below</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={challengeForm.title}
                          onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                          placeholder="Challenge title"
                        />
                      </div>
                      <div>
                        <Label>Description *</Label>
                        <Textarea
                          value={challengeForm.description}
                          onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                          placeholder="Challenge description"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={challengeForm.category}
                            onChange={(e) => setChallengeForm({ ...challengeForm, category: e.target.value })}
                            placeholder="e.g., Environment"
                          />
                        </div>
                        <div>
                          <Label>Difficulty</Label>
                          <Select
                            value={challengeForm.difficulty}
                            onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                              setChallengeForm({ ...challengeForm, difficulty: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Duration (days)</Label>
                          <Input
                            type="number"
                            value={challengeForm.duration}
                            onChange={(e) => setChallengeForm({ ...challengeForm, duration: parseInt(e.target.value) || 7 })}
                          />
                        </div>
                        <div>
                          <Label>Eco Points</Label>
                          <Input
                            type="number"
                            value={challengeForm.ecoPoints}
                            onChange={(e) => setChallengeForm({ ...challengeForm, ecoPoints: parseInt(e.target.value) || 100 })}
                          />
                        </div>
                        <div>
                          <Label>Image URL</Label>
                          <Input
                            value={challengeForm.imageUrl}
                            onChange={(e) => setChallengeForm({ ...challengeForm, imageUrl: e.target.value })}
                            placeholder="/images/challenge.jpg"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Instructions *</Label>
                          <Button type="button" size="sm" onClick={addChallengeInstruction}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Instruction
                          </Button>
                        </div>
                        <div className="space-y-2 border rounded-lg p-4">
                          {challengeForm.instructions?.map((instruction, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Instruction ${index + 1}`}
                                value={instruction}
                                onChange={(e) => updateChallengeInstruction(index, e.target.value)}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeChallengeInstruction(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {(!challengeForm.instructions || challengeForm.instructions.length === 0) && (
                            <p className="text-center text-gray-500 py-2">No instructions added yet</p>
                          )}
                        </div>
                      </div>
                      <Button onClick={handleSaveChallenge} className="w-full">
                        {editingChallenge ? 'Update Challenge' : 'Create Challenge'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.map(challenge => (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <CardDescription>{challenge.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className="mb-2">{challenge.difficulty}</Badge>
                      <p className="text-sm text-gray-600 mb-2">{challenge.instructions.length} instructions</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditChallenge(challenge)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteChallenge(challenge.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}