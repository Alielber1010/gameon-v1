"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Calendar, Clock, Loader2, Trophy, Star, Flag, CheckCircle2, TrendingUp } from "lucide-react"
import { CompletedGameDetailsModal } from "@/components/dashboard/completed-game-details-modal"
import { ReportModal } from "@/components/dashboard/report-modal"
import type { Game } from "@/lib/db/models/types/game"
import { getCompletedGames } from "@/lib/api/games"
import { formatLocationForDisplay } from "@/lib/utils/location"
import { toast } from "sonner"

// Transform API game data to frontend Game type
function transformApiGameToGame(apiGame: any): Game {
  const dateObj = new Date(apiGame.date);
  const formattedDate = dateObj.toISOString().split('T')[0];
  const isToday = dateObj.toDateString() === new Date().toDateString();
  
  // Format location - handle both string and object formats
  const locationDisplay = typeof apiGame.location === 'string' 
    ? apiGame.location 
    : apiGame.location?.address || 'Location not specified';
  
  return {
    id: apiGame.id,
    hostId: apiGame.hostId,
    hostName: apiGame.hostName,
    hostImage: apiGame.hostImage,
    title: apiGame.title,
    sport: apiGame.sport,
    image: apiGame.image || '/placeholder.svg?height=200&width=300',
    location: locationDisplay,
    skillLevel: apiGame.skillLevel || 'all',
    seatsLeft: apiGame.seatsLeft || 0,
    date: isToday ? 'Today' : formattedDate,
    time: apiGame.startTime || '',
    endTime: apiGame.endTime || '',
    description: apiGame.description || '',
    hostWhatsApp: apiGame.hostWhatsApp || '',
    teamMembers: apiGame.registeredPlayers?.length || 0,
    minSkillLevel: apiGame.minSkillLevel || apiGame.skillLevel || 'all',
    maxPlayers: apiGame.maxPlayers,
    registeredPlayers: apiGame.registeredPlayers || [],
    attendance: apiGame.attendance || [],
    status: apiGame.status || 'completed',
    startTime: apiGame.startTime || '',
    completedAt: apiGame.completedAt,
    userAttended: apiGame.userAttended,
    isHost: apiGame.isHost,
    playersRated: apiGame.playersRated || [],
  };
}

function CompletedGamesPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [reportingGame, setReportingGame] = useState<Game | null>(null);
  const [analytics, setAnalytics] = useState({
    totalGames: 0,
    gamesAttended: 0,
    averageRating: 0,
    totalRatings: 0,
    mostPlayedSport: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCompletedGames();
    }
  }, [status]);

  // Handle gameId from URL query parameter (from notifications)
  useEffect(() => {
    const gameId = searchParams.get('gameId');
    if (gameId && !selectedGame) {
      // First try to find in already loaded games
      const existingGame = games.find(g => g.id === gameId);
      if (existingGame) {
        setSelectedGame(existingGame);
        // Clean up URL by removing query parameter
        window.history.replaceState({}, '', '/dashboard/completed');
      } else if (games.length > 0) {
        // If game not found in list, fetch it directly
        const fetchGame = async () => {
          try {
            const { getGameById } = await import('@/lib/api/games');
            const response = await getGameById(gameId);
            if (response.success && response.data) {
              const game = transformApiGameToGame(response.data);
              setSelectedGame(game);
              // Clean up URL by removing query parameter
              window.history.replaceState({}, '', '/dashboard/completed');
            }
          } catch (error) {
            console.error('Error fetching game:', error);
          }
        };
        fetchGame();
      }
    }
  }, [games, searchParams, selectedGame]);

  const fetchCompletedGames = async () => {
    setIsLoading(true);
    try {
      const response = await getCompletedGames();
      if (response.success && response.data) {
        const transformedGames = (response.data as any[]).map(transformApiGameToGame);
        setGames(transformedGames);
        
        // Calculate analytics
        const totalGames = transformedGames.length;
        const gamesAttended = transformedGames.filter(g => g.userAttended).length;
        
        // Get user stats for rating
        try {
          const userResponse = await fetch('/api/users/profile');
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            setAnalytics({
              totalGames,
              gamesAttended,
              averageRating: userData.user.averageRating || 0,
              totalRatings: userData.user.totalRatings || 0,
              mostPlayedSport: getMostPlayedSport(transformedGames),
            });
          } else {
            setAnalytics({
              totalGames,
              gamesAttended,
              averageRating: 0,
              totalRatings: 0,
              mostPlayedSport: getMostPlayedSport(transformedGames),
            });
          }
        } catch (err) {
          setAnalytics({
            totalGames,
            gamesAttended,
            averageRating: 0,
            totalRatings: 0,
            mostPlayedSport: getMostPlayedSport(transformedGames),
          });
        }
      } else {
        toast.error(response.error || 'Failed to fetch completed games');
      }
    } catch (error: any) {
      console.error('Error fetching completed games:', error);
      toast.error('Failed to fetch completed games');
    } finally {
      setIsLoading(false);
    }
  };

  const getMostPlayedSport = (games: Game[]): string => {
    if (games.length === 0) return 'N/A';
    const sportCounts: { [key: string]: number } = {};
    games.forEach(game => {
      const sport = game.sport || 'Unknown';
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });
    const sorted = Object.entries(sportCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
  };

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
  };

  const handleReport = (game: Game) => {
    setReportingGame(game);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'Date not set';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time: string) => {
    if (!time) return 'Time not set';
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return time;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-green-600" />
              Previously Played Games
            </h1>
            <p className="text-gray-600 mt-1">View and rate players from your completed games</p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Games Played</p>
                  <p className="text-3xl font-bold text-green-900">{analytics.totalGames}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Trophy className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Games Attended</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics.gamesAttended}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {analytics.totalGames > 0 
                      ? `${Math.round((analytics.gamesAttended / analytics.totalGames) * 100)}% attendance`
                      : '0% attendance'}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 mb-1">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-yellow-900">
                      {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : 'N/A'}
                    </p>
                    {analytics.averageRating > 0 && (
                      <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                    )}
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    {analytics.totalRatings} {analytics.totalRatings === 1 ? 'rating' : 'ratings'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-full">
                  <Star className="h-6 w-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Most Played Sport</p>
                  <p className="text-2xl font-bold text-purple-900 capitalize">{analytics.mostPlayedSport}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {games.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Completed Games Yet</h3>
          <p className="text-gray-600">Games you've participated in will appear here after completion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="relative">
                <img
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge className="bg-green-600 text-white">
                    <Trophy className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReport(game);
                    }}
                    className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                  >
                    <Flag className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-4" onClick={() => handleGameClick(game)}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{game.title}</h3>
                  </div>

                  {/* Sport Type */}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {game.sport}
                    </Badge>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(game.date)}</span>
                  </div>
                  {game.time && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(game.time)}</span>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {(() => {
                      const locationDisplay = formatLocationForDisplay(game.location);
                      return <span className="truncate">{locationDisplay.text}</span>;
                    })()}
                  </div>

                  {/* Players */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>
                      {((game.registeredPlayers?.length || 0) + 1)} / {game.maxPlayers || 'N/A'} players
                    </span>
                  </div>

                  {/* Attendance Status */}
                  {game.userAttended !== undefined && (
                    <div className="pt-2 border-t">
                      <Badge
                        variant={game.userAttended ? "default" : "secondary"}
                        className={game.userAttended ? "bg-green-600" : "bg-gray-200"}
                      >
                        {game.userAttended ? "✓ Attended" : "✗ Not Attended"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Game Details Modal */}
      {selectedGame && (
        <CompletedGameDetailsModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          onReport={() => {
            setSelectedGame(null);
            setReportingGame(selectedGame);
          }}
          onGameUpdated={(updatedGame) => {
            if (updatedGame) {
              setSelectedGame(updatedGame);
              fetchCompletedGames();
            }
          }}
        />
      )}

      {/* Report Modal */}
      {reportingGame && (
        <ReportModal
          game={reportingGame}
          isOpen={!!reportingGame}
          onClose={() => setReportingGame(null)}
        />
      )}
    </div>
  );
}

export default function CompletedGamesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <CompletedGamesPageContent />
    </Suspense>
  );
}

