"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Users, Calendar, Clock, Loader2, Trophy, Star, Flag, CheckCircle2, TrendingUp, Crown, Award, Target, UserCheck, UserX, Gamepad2, Activity, Zap, BarChart3 } from "lucide-react"
import Image from "next/image"
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [analytics, setAnalytics] = useState({
    totalGames: 0,
    gamesAttended: 0,
    averageRating: 0,
    totalRatings: 0,
    mostPlayedSport: '',
    gamesHosted: 0,
    gamesJoined: 0,
    totalPlayersPlayedWith: 0,
    uniqueSportsCount: 0,
    gamesThisMonth: 0,
    attendanceRate: 0,
    ratingCompletionRate: 0,
    totalHoursPlayed: 0,
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
        const attendanceRate = totalGames > 0 ? (gamesAttended / totalGames) * 100 : 0;
        
        // Games hosted vs joined
        const gamesHosted = transformedGames.filter(g => g.isHost).length;
        const gamesJoined = transformedGames.filter(g => !g.isHost).length;
        
        // Total unique players played with
        const uniquePlayerIds = new Set<string>();
        transformedGames.forEach(game => {
          if (game.hostId) uniquePlayerIds.add(game.hostId);
          game.registeredPlayers?.forEach((player: any) => {
            const playerId = player.userId?.toString() || player.id?.toString() || player.userId;
            if (playerId) uniquePlayerIds.add(playerId);
          });
        });
        // Remove current user from count
        const currentUserId = session?.user?.id;
        if (currentUserId) uniquePlayerIds.delete(currentUserId);
        const totalPlayersPlayedWith = uniquePlayerIds.size;
        
        // Unique sports count
        const uniqueSports = new Set(transformedGames.map(g => g.sport).filter(Boolean));
        const uniqueSportsCount = uniqueSports.size;
        
        // Games this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const gamesThisMonth = transformedGames.filter(game => {
          const gameDate = game.completedAt ? new Date(game.completedAt) : new Date(game.date);
          return gameDate >= startOfMonth;
        }).length;
        
        // Rating completion rate
        const gamesWithRatings = transformedGames.filter(game => {
          const totalPlayers = (game.registeredPlayers?.length || 0) + 1;
          const playersRated = game.playersRated?.length || 0;
          const playersToRate = totalPlayers - playersRated - 1;
          return playersToRate === 0 && totalPlayers > 1;
        }).length;
        const ratingCompletionRate = totalGames > 0 ? (gamesWithRatings / totalGames) * 100 : 0;
        
        // Total hours played (estimate from game duration)
        let totalHoursPlayed = 0;
        transformedGames.forEach(game => {
          if (game.time && game.endTime) {
            try {
              const [startHour, startMin] = game.time.split(':').map(Number);
              const [endHour, endMin] = game.endTime.split(':').map(Number);
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              let durationMinutes = endMinutes - startMinutes;
              if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight games
              totalHoursPlayed += durationMinutes / 60;
            } catch (e) {
              // If parsing fails, estimate 2 hours per game
              totalHoursPlayed += 2;
            }
          } else {
            // Default estimate if no end time
            totalHoursPlayed += 2;
          }
        });
        
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
              gamesHosted,
              gamesJoined,
              totalPlayersPlayedWith,
              uniqueSportsCount,
              gamesThisMonth,
              attendanceRate,
              ratingCompletionRate,
              totalHoursPlayed: Math.round(totalHoursPlayed),
            });
          } else {
            setAnalytics({
              totalGames,
              gamesAttended,
              averageRating: 0,
              totalRatings: 0,
              mostPlayedSport: getMostPlayedSport(transformedGames),
              gamesHosted,
              gamesJoined,
              totalPlayersPlayedWith,
              uniqueSportsCount,
              gamesThisMonth,
              attendanceRate,
              ratingCompletionRate,
              totalHoursPlayed: Math.round(totalHoursPlayed),
            });
          }
        } catch (err) {
          setAnalytics({
            totalGames,
            gamesAttended,
            averageRating: 0,
            totalRatings: 0,
            mostPlayedSport: getMostPlayedSport(transformedGames),
            gamesHosted,
            gamesJoined,
            totalPlayersPlayedWith,
            uniqueSportsCount,
            gamesThisMonth,
            attendanceRate,
            ratingCompletionRate,
            totalHoursPlayed: Math.round(totalHoursPlayed),
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

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...games];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(game => 
        game.title.toLowerCase().includes(query) ||
        game.sport.toLowerCase().includes(query) ||
        game.hostName?.toLowerCase().includes(query) ||
        (typeof game.location === 'string' ? game.location.toLowerCase() : game.location?.address?.toLowerCase() || '').includes(query)
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      if (filterBy === 'attended') {
        filtered = filtered.filter(game => game.userAttended === true);
      } else if (filterBy === 'not-attended') {
        filtered = filtered.filter(game => game.userAttended === false);
      } else if (filterBy === 'rated') {
        filtered = filtered.filter(game => {
          const totalPlayers = (game.registeredPlayers?.length || 0) + 1;
          const playersRated = game.playersRated?.length || 0;
          const playersToRate = totalPlayers - playersRated - 1;
          return playersToRate === 0 && totalPlayers > 1;
        });
      } else if (filterBy === 'not-rated') {
        filtered = filtered.filter(game => {
          const totalPlayers = (game.registeredPlayers?.length || 0) + 1;
          const playersRated = game.playersRated?.length || 0;
          const playersToRate = totalPlayers - playersRated - 1;
          return playersToRate > 0;
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const dateA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.date).getTime();
          const dateB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.date).getTime();
          return dateB - dateA;
        case 'oldest':
          const dateAOld = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.date).getTime();
          const dateBOld = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.date).getTime();
          return dateAOld - dateBOld;
        case 'sport':
          return (a.sport || '').localeCompare(b.sport || '');
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [games, searchQuery, sortBy, filterBy]);

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

      {/* Search and Filter Bar */}
      {games.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search games by title, sport, host, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="attended">Attended</SelectItem>
                    <SelectItem value="not-attended">Not Attended</SelectItem>
                    <SelectItem value="rated">All Rated</SelectItem>
                    <SelectItem value="not-rated">Needs Rating</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="sport">Sport (A-Z)</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {searchQuery || filterBy !== 'all' ? (
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedGames.length} of {games.length} games
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {games.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Completed Games Yet</h3>
          <p className="text-gray-600">Games you've participated in will appear here after completion.</p>
        </div>
      ) : filteredAndSortedGames.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Games Match Your Filters</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedGames.map((game) => {
            const totalPlayers = (game.registeredPlayers?.length || 0) + 1;
            const playersRated = game.playersRated?.length || 0;
            const playersToRate = totalPlayers - playersRated - 1; // Exclude self
            const skillLevelDisplay = game.skillLevel === 'all' ? 'All Levels' : game.skillLevel?.charAt(0).toUpperCase() + game.skillLevel?.slice(1) || 'N/A';
            const completionDate = game.completedAt ? formatDate(game.completedAt) : null;
            
            return (
              <Card
                key={game.id}
                className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-500"
              >
                <div className="relative">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    <Badge className="bg-green-600 text-white shadow-lg">
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
                      className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-md"
                    >
                      <Flag className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-xl text-white drop-shadow-lg line-clamp-2">{game.title}</h3>
                  </div>
                </div>

                <CardContent className="p-5" onClick={() => handleGameClick(game)}>
                  <div className="space-y-4">
                    {/* Sport and Skill Level */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 font-semibold">
                        {game.sport?.charAt(0).toUpperCase() + game.sport?.slice(1).replace(/-/g, ' ') || 'Sport'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {skillLevelDisplay}
                      </Badge>
                    </div>

                    {/* Host Information */}
                    {game.hostName && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        {game.hostImage ? (
                          <Image
                            src={game.hostImage}
                            alt={game.hostName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{game.hostName.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900 truncate">{game.hostName}</span>
                            <Crown className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                          </div>
                          <span className="text-xs text-gray-500">Host</span>
                        </div>
                      </div>
                    )}

                    {/* Date, Time, and Duration */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium">{formatDate(game.date)}</span>
                      </div>
                      {game.time && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span>{formatTime(game.time)}</span>
                          {game.endTime && (
                            <span className="text-gray-500">- {formatTime(game.endTime)}</span>
                          )}
                        </div>
                      )}
                      {completionDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed on {completionDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {(() => {
                          const locationDisplay = formatLocationForDisplay(game.location);
                          return locationDisplay.text;
                        })()}
                      </span>
                    </div>

                    {/* Players and Attendance */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            {totalPlayers} / {game.maxPlayers || 'N/A'} players
                          </span>
                        </div>
                        {game.userAttended !== undefined && (
                          <Badge
                            variant={game.userAttended ? "default" : "secondary"}
                            className={game.userAttended ? "bg-green-600" : "bg-gray-300 text-gray-700"}
                          >
                            {game.userAttended ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Attended
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Not Attended
                              </>
                            )}
                          </Badge>
                        )}
                      </div>

                      {/* Rating Status */}
                      {playersToRate > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <Award className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-xs text-blue-700 font-medium">
                            {playersToRate} {playersToRate === 1 ? 'player' : 'players'} remaining to rate
                          </span>
                        </div>
                      )}
                      {playersToRate === 0 && totalPlayers > 1 && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <Star className="h-4 w-4 text-green-600 flex-shrink-0 fill-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            All players rated
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

