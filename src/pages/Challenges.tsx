import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllChallenges, saveSubmission, getAllSubmissions } from '@/lib/storage';
import { uploadProofFile } from '@/lib/supabaseService';
import { ChallengeSubmission, Challenge } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target, Award, CheckCircle, Clock, AlertCircle, XCircle, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

export default function Challenges() {
  const { user, updateUser } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setChallenges(getAllChallenges());
    loadSubmissions();
  }, [user]);

  const loadSubmissions = async () => {
    if (user) {
      const allSubmissions = await getAllSubmissions();
      const userSubmissions = allSubmissions.filter(s => s.userId === user.id);
      setSubmissions(userSubmissions);
    }
  };

  if (!user) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload JPG, PNG, or PDF files only.');
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size exceeds 5MB limit. Please choose a smaller file.');
        e.target.value = '';
        return;
      }

      setProofFile(file);
    }
  };

  const handleSubmit = async (challengeId: string) => {
    if (!description.trim()) {
      toast.error('Please describe how you completed the challenge');
      return;
    }

    if (!proofFile) {
      toast.error('Please upload proof to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload proof file to Supabase Storage
      let proofUrl = '';
      try {
        proofUrl = await uploadProofFile(proofFile, user.id, challengeId);
      } catch (uploadError: any) {
        toast.error(uploadError.message || 'Failed to upload proof file');
        setIsSubmitting(false);
        return;
      }

      const submission: ChallengeSubmission = {
        id: `submission-${Date.now()}`,
        challengeId,
        userId: user.id,
        userName: user.name,
        schoolId: user.schoolId,
        submittedAt: new Date().toISOString(),
        description: description.trim(),
        photoUrl: proofUrl,
        status: 'pending',
      };

      await saveSubmission(submission);
      await loadSubmissions(); // Reload submissions to update UI
      toast.success('Challenge submitted for verification! Waiting for teacher approval.');
      setDescription('');
      setProofFile(null);
      setSelectedChallenge(null);
    } catch (error) {
      toast.error('Failed to submit challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChallengeStatus = (challengeId: string): 'pending' | 'approved' | 'rejected' | null => {
    const challengeSubmissions = submissions.filter(s => s.challengeId === challengeId);
    if (challengeSubmissions.length === 0) return null;
    // Get the most recent submission
    const mostRecent = challengeSubmissions.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )[0];
    return mostRecent.status;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Environmental Challenges
        </h1>
        <p className="text-gray-600">
          Take real-world action and make a difference
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map(challenge => {
          const status = getChallengeStatus(challenge.id);
          const isCompleted = status === 'approved';
          const isPending = status === 'pending';
          const isRejected = status === 'rejected';
          
          return (
            <Card
              key={challenge.id}
              className={`hover:shadow-lg transition-all ${
                isCompleted ? 'border-purple-500 border-2' : 
                isPending ? 'border-yellow-500 border-2' :
                isRejected ? 'border-red-500 border-2' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                  {isCompleted && (
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  )}
                  {isPending && (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  )}
                  {isRejected && (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <CardTitle className="text-xl">{challenge.title}</CardTitle>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    <span>{challenge.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{challenge.duration} days</span>
                  </div>
                  <div className="flex items-center text-sm text-purple-600 font-semibold">
                    <Award className="h-4 w-4 mr-2" />
                    <span>{challenge.ecoPoints} Eco Points</span>
                  </div>
                  {challenge.verificationRequired && (
                    <div className="flex items-center text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <span>Requires teacher verification</span>
                    </div>
                  )}
                  {isPending && (
                    <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Pending teacher approval</span>
                    </div>
                  )}
                  {isRejected && (
                    <div className="flex items-center text-xs text-red-600 bg-red-50 p-2 rounded">
                      <XCircle className="h-3 w-3 mr-1" />
                      <span>Submission rejected</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center text-xs text-purple-600 bg-purple-50 p-2 rounded">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Challenge completed</span>
                    </div>
                  )}
                  
                  <Dialog open={selectedChallenge === challenge.id} onOpenChange={(open) => {
                    if (!open) {
                      setSelectedChallenge(null);
                      setDescription('');
                      setProofFile(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                        onClick={() => setSelectedChallenge(challenge.id)}
                        disabled={isCompleted}
                      >
                        {isCompleted ? 'Challenge Completed ✓' : 
                         isPending ? 'Pending Approval' :
                         isRejected ? 'Resubmit Challenge' :
                         'Take Challenge'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{challenge.title}</DialogTitle>
                        <DialogDescription>{challenge.description}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Instructions:</h3>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            {challenge.instructions.map((instruction, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Describe your completion:</h3>
                          <Textarea
                            placeholder="Tell us how you completed this challenge..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label htmlFor="proof-upload" className="font-semibold mb-2 block">
                             Upload File (Image/PDF): <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="proof-upload"
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={handleFileChange}
                              className="flex-1"
                            />
                            <Paperclip className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Accepted formats: JPG, PNG, PDF (Max 5MB)
                          </p>
                          {proofFile && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ Selected: {proofFile.name}
                            </p>
                          )}
                          {!proofFile && (
                            <p className="text-sm text-red-500 mt-2">
                              Please upload File (Image/PDF) to continue.
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleSubmit(challenge.id)}
                          disabled={isSubmitting || !description.trim() || !proofFile}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Challenge'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}