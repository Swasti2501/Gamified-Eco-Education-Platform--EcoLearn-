import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '@/types';

export default function Leaderboard() {
  const { user } = useAuth();
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [schoolLeaderboard, setSchoolLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboards = async () => {
      if (!user) return;
      try {
        const [global, school] = await Promise.all([
          getLeaderboard(),
          getLeaderboard(user.schoolId)
        ]);
        setGlobalLeaderboard(global);
        setSchoolLeaderboard(school);
      } catch (error) {
        console.error('Error loading leaderboards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeaderboards();
  }, [user]);

  if (!user) return null;
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p>Loading...</p>
      </div>
    );
  }

  const userGlobalRank = globalLeaderboard.findIndex(entry => entry.userId === user.id) + 1;
  const userSchoolRank = schoolLeaderboard.findIndex(entry => entry.userId === user.id) + 1;

  const renderLeaderboardTable = (leaderboard: typeof globalLeaderboard, showSchool: boolean = false) => (
    <div className="space-y-3">
      {leaderboard.map((entry, index) => {
        const isCurrentUser = entry.userId === user.id;
        const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];
        
        return (
          <div
            key={entry.userId}
            className={`flex items-center justify-between p-4 rounded-lg transition-all ${
              isCurrentUser
                ? 'bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500'
                : index < 3
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={`text-2xl font-bold ${index < 3 ? rankColors[index] : 'text-gray-400'}`}>
                #{entry.rank}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg">{entry.userName}</p>
                  {isCurrentUser && (
                    <Badge className="bg-green-100 text-green-800">You</Badge>
                  )}
                </div>
                {showSchool && (
                  <p className="text-sm text-gray-600">{entry.schoolName}</p>
                )}
                {entry.classGrade && (
                  <p className="text-xs text-gray-500">{entry.classGrade}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">{entry.ecoPoints}</p>
              <p className="text-xs text-gray-500">Eco Points</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <Award className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{entry.badgeCount} badges</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Leaderboard
        </h1>
        <p className="text-gray-600">
          See how you rank among eco-warriors
        </p>
      </div>

      {/* User Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Your Eco Points</p>
                <p className="text-4xl font-bold">{user.ecoPoints}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">School Rank</p>
                <p className="text-4xl font-bold">#{userSchoolRank || '-'}</p>
              </div>
              <Trophy className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Global Rank</p>
                <p className="text-4xl font-bold">#{userGlobalRank || '-'}</p>
              </div>
              <Award className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>Top eco-warriors making a difference</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="school">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="school">
                My School ({schoolLeaderboard.length})
              </TabsTrigger>
              <TabsTrigger value="global">
                Global ({globalLeaderboard.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="school" className="mt-6">
              {schoolLeaderboard.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No students in your school yet</p>
              ) : (
                renderLeaderboardTable(schoolLeaderboard.slice(0, 50))
              )}
            </TabsContent>

            <TabsContent value="global" className="mt-6">
              {globalLeaderboard.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No students yet</p>
              ) : (
                renderLeaderboardTable(globalLeaderboard.slice(0, 50), true)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}