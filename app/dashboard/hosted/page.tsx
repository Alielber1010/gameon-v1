"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Calendar, Clock, Edit, Trash2, Loader2, ExternalLink, Crown } from "lucide-react"
import { HostedGameManagementModal } from "@/components/dashboard/hosted-game-management-modal"
import { UserProfileModal } from "@/components/dashboard/user-profile-modal"
import { EditGameModal } from "@/components/dashboard/edit-game-modal"
import type { Game, JoinRequest, Player, UserProfile } from "@/types/game"
import { useGames } from "@/hooks/use-games"
import { deleteGame, acceptJoinRequest, rejectJoinRequest, getGameById, transferHost, getGamesWithPendingRequests, removePlayerFromGame } from "@/lib/api/games"
import { formatLocationForDisplay } from "@/lib/utils/location"
import { toast } from "sonner"
import { useDialog } from "@/lib/utils/dialog"

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
    teamBlue: apiGame.teamBlue || [],
    teamRed: apiGame.teamRed || [],
    joinRequests: apiGame.joinRequests || [],
    registeredPlayers: apiGame.registeredPlayers || [],
    status: apiGame.status || 'upcoming',
    startTime: apiGame.startTime || '',
    // Store original date for time comparison
    originalDate: apiGame.date,
  };
}

export default function HostedGamesPage() {
  const { data: session, status } = useSession();
  const { confirm } = useDialog()
  const searchParams = useSearchParams()
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editingGame, setEditingGame] = useState<Game | null>(null)

  // Fetch hosted games
  const { games: hostedApiGames, loading: loadingHosted, error: errorHosted, refetch: refetchHosted } = useGames({
    hostId: status === 'authenticated' && session?.user?.id ? session.user.id : undefined,
    status: 'upcoming',
    limit: 100,
    enabled: status === 'authenticated',
  });

  // Fetch all upcoming games to find joined games
  const { games: allApiGames, loading: loadingAll, error: errorAll, refetch: refetchAll } = useGames({
    status: 'upcoming',
    limit: 100,
    enabled: status === 'authenticated',
  });

  // Fetch games with pending join requests
  const [pendingRequestGames, setPendingRequestGames] = useState<Game[]>([]);
  const [loadingPendingRequests, setLoadingPendingRequests] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPendingRequestGames();
    }
  }, [status]);

  const fetchPendingRequestGames = async () => {
    setLoadingPendingRequests(true);
    try {
      const response = await getGamesWithPendingRequests();
      if (response.success && response.data) {
        setPendingRequestGames(response.data.map(transformApiGameToGame));
      }
    } catch (error) {
      console.error('Error fetching pending request games:', error);
    } finally {
      setLoadingPendingRequests(false);
    }
  };

  const loading = loadingHosted || loadingAll;
  const error = errorHosted || errorAll;

  // Transform and filter games
  const hostedGames = useMemo(() => {
    if (!hostedApiGames || hostedApiGames.length === 0) return [];
    return hostedApiGames.map(transformApiGameToGame);
  }, [hostedApiGames]);

  // Filter joined games (games where user is a registered player but not the host)
  const joinedGames = useMemo(() => {
    if (!allApiGames || allApiGames.length === 0) return [];
    const currentUserId = session?.user?.id;
    if (!currentUserId) return [];
    
    return allApiGames
      .map(transformApiGameToGame)
      .filter((game) => {
        // Not a hosted game
        if (game.hostId === currentUserId) return false;
        
        // Check if user is in registeredPlayers
        return game.registeredPlayers?.some((player: any) => {
          const playerUserId = player.userId?.toString() || player.userId || player.id;
          return playerUserId === currentUserId;
        });
      });
  }, [allApiGames, session?.user?.id]);

  // Refetch function that refetches all
  const refetch = async () => {
    await Promise.all([refetchHosted(), refetchAll(), fetchPendingRequestGames()]);
  };

  // Check for gameId in URL query params and open that game's modal
  useEffect(() => {
    const gameId = searchParams.get('gameId')
    if (gameId && !selectedGame) {
      // First try to find in already loaded games (check both hosted and joined)
      const existingGame = [...hostedGames, ...joinedGames].find(g => g.id === gameId)
      if (existingGame) {
        setSelectedGame(existingGame)
        // Clean up URL by removing query parameter
        window.history.replaceState({}, '', '/dashboard/hosted')
      } else if (hostedGames.length > 0 || joinedGames.length > 0) {
        // If game not found in list, fetch it directly
        const fetchGame = async () => {
          try {
            const response = await getGameById(gameId)
            if (response.success && response.data) {
              const game = transformApiGameToGame(response.data)
              setSelectedGame(game)
              // Refresh the games list to include this game
              refetch()
              // Clean up URL by removing query parameter
              window.history.replaceState({}, '', '/dashboard/hosted')
            }
          } catch (error) {
            console.error('Error fetching game:', error)
          }
        }
        fetchGame()
      }
    }
  }, [searchParams, hostedGames, joinedGames, selectedGame, refetch])

  const handleDeleteGame = async (gameId: string) => {
    const confirmed = await confirm('Are you sure you want to delete this game?', {
      title: 'Delete Game',
      variant: 'destructive',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) {
      return;
    }

    try {
      const response = await deleteGame(gameId);
      if (response.success) {
        toast.success('Game deleted successfully');
        // Refresh the games list
        refetch();
      } else {
        toast.error(response.error || 'Failed to delete game');
      }
    } catch (error: any) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game. Please try again.');
    }
  }

  const handleGameClick = (game: Game) => {
    setSelectedGame(game)
  }

  const handleUserClick = (user: Player | JoinRequest) => {
    const userProfile: UserProfile = {
      id: user.id || user.userId,
      name: user.name || user.userName,
      age: user.age || user.userAge,
      skillLevel: user.skillLevel || user.userSkillLevel,
      image: user.image || user.userImage,
      whatsApp: user.whatsApp || user.userWhatsApp,
      bio: "Passionate sports player who loves team games and staying active.",
      gamesPlayed: 15,
      rating: 4.5,
    }
    setSelectedUser(userProfile)
  }

  const handleAcceptRequest = async (gameId: string, requestId: string) => {
    try {
      const response = await acceptJoinRequest(gameId, requestId)
      
      if (response.success) {
        toast.success('Join request accepted!')
        // Refresh the games list
        await refetch()
        // Update selected game with fresh data
        if (selectedGame && selectedGame.id === gameId && response.data) {
          const updatedGame = transformApiGameToGame(response.data)
          setSelectedGame(updatedGame)
        }
      } else {
        toast.error(response.error || 'Failed to accept join request')
      }
    } catch (error: any) {
      console.error('Error accepting join request:', error)
      toast.error('Failed to accept join request. Please try again.')
    }
  }

  const handleRejectRequest = async (gameId: string, requestId: string) => {
    try {
      const response = await rejectJoinRequest(gameId, requestId)
      
      if (response.success) {
        toast.success('Join request rejected')
        // Refresh the games list
        await refetch()
        // Update selected game with fresh data
        if (selectedGame && selectedGame.id === gameId && response.data) {
          const updatedGame = transformApiGameToGame(response.data)
          setSelectedGame(updatedGame)
        }
      } else {
        toast.error(response.error || 'Failed to reject join request')
      }
    } catch (error: any) {
      console.error('Error rejecting join request:', error)
      toast.error('Failed to reject join request. Please try again.')
    }
  }

  const handleRemovePlayer = async (gameId: string, playerId: string) => {
    const confirmed = await confirm('Are you sure you want to remove this player from the game?', {
      title: 'Remove Player',
      message: 'This player will be removed from the game and will receive a notification.',
      variant: 'destructive',
      confirmText: 'Remove',
      cancelText: 'Cancel',
    })
    
    if (!confirmed) {
      return
    }

    try {
      const response = await removePlayerFromGame(gameId, playerId)
      
      if (response.success) {
        toast.success('Player removed successfully')
        // Refresh game data
        if (selectedGame && selectedGame.id === gameId) {
          const updatedGame = await getGameById(gameId)
          if (updatedGame.success && updatedGame.data) {
            setSelectedGame(transformApiGameToGame(updatedGame.data as any))
          }
        }
        // Refresh the games list
        await refetch()
      } else {
        toast.error(response.error || 'Failed to remove player')
      }
    } catch (error: any) {
      console.error('Error removing player:', error)
      toast.error('Failed to remove player. Please try again.')
    }
  }

  const handleEditGame = (game: Game) => {
    setEditingGame(game)
  }

  const handleEditSuccess = () => {
    // Refresh games list after successful edit
    refetch()
    setEditingGame(null)
  }

  const handleTransferHost = async (gameId: string, newHostId: string) => {
    try {
      const response = await transferHost(gameId, newHostId)
      
      if (response.success) {
        toast.success('Host ownership transferred successfully!')
        // Close the modal immediately
        setSelectedGame(null)
        // Refresh the games list - this will automatically filter out games where user is no longer host
        await refetch()
      } else {
        toast.error(response.error || 'Failed to transfer host ownership')
      }
    } catch (error: any) {
      console.error('Error transferring host:', error)
      toast.error('Failed to transfer host ownership. Please try again.')
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold text-green-600">Upcoming Games</h1>
      </div>

      {/* Hosted Games Section */}
      {hostedGames.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Hosted Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostedGames.map((game) => (
              <Card 
                key={game.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative ring-2 ring-yellow-400 ring-offset-2"
                onClick={() => handleGameClick(game)}
              >
                {/* Golden frame and crown for hosted games */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-yellow-400 rounded-full p-1.5 shadow-lg">
                    <Crown className="h-4 w-4 text-yellow-800" />
                  </div>
                </div>
                <div className="relative">
                  <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {game.sport}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">
                      {game.title}
                    </h3>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Host
                    </Badge>
                  </div>

                <p className="text-sm text-gray-600 line-clamp-2">{game.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {(() => {
                      const locationDisplay = formatLocationForDisplay(game.location)
                      if (locationDisplay.isLink && locationDisplay.url) {
                        return (
                          <a
                            href={locationDisplay.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 text-sm"
                          >
                            {locationDisplay.text}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )
                      }
                      return <span className="text-sm">{locationDisplay.text}</span>
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{game.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{game.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{game.seatsLeft} spots available</span>
                  </div>

                  {game.joinRequests && game.joinRequests.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {game.joinRequests.length} pending requests
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="font-medium">Skill level:</span>
                    <Badge variant="outline" className="text-xs">
                      {game.skillLevel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Join Requests Section */}
      {pendingRequestGames.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Pending Join Requests</h2>
          <p className="text-sm text-gray-500 mb-4">Games you've requested to join - waiting for host approval</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequestGames.map((game) => (
              <Card 
                key={game.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative border-2 border-orange-200"
                onClick={() => handleGameClick(game)}
              >
                <div className="relative">
                  <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Pending
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {game.sport}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">
                      {game.title}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{game.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {(() => {
                        const locationDisplay = formatLocationForDisplay(game.location)
                        if (locationDisplay.isLink && locationDisplay.url) {
                          return (
                            <a
                              href={locationDisplay.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 text-sm"
                            >
                              {locationDisplay.text}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )
                        }
                        return <span className="text-sm">{locationDisplay.text}</span>
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{game.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{game.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{game.seatsLeft} spots available</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Skill level:</span>
                      <Badge variant="outline" className="text-xs">
                        {game.skillLevel}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Joined Games Section */}
      {joinedGames.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Joined Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedGames.map((game) => (
              <Card 
                key={game.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleGameClick(game)}
              >
                <div className="relative">
                  <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {game.sport}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">
                      {game.title}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{game.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {(() => {
                        const locationDisplay = formatLocationForDisplay(game.location)
                        if (locationDisplay.isLink && locationDisplay.url) {
                          return (
                            <a
                              href={locationDisplay.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 text-sm"
                            >
                              {locationDisplay.text}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )
                        }
                        return <span className="text-sm">{locationDisplay.text}</span>
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{game.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{game.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{game.seatsLeft} spots available</span>
                    </div>

                    {game.joinRequests && game.joinRequests.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {game.joinRequests.length} pending requests
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Skill level:</span>
                      <Badge variant="outline" className="text-xs">
                        {game.skillLevel}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && hostedGames.length === 0 && joinedGames.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-12 w-12 text-green-600" />
          </div>
          <p className="text-gray-500 text-lg mb-2">No upcoming games yet</p>
          <p className="text-gray-400">Create your first game or join a game to see them here!</p>
        </div>
      )}

      {/* Hosted Game Management Modal */}
      {selectedGame && (
        <HostedGameManagementModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onRemovePlayer={handleRemovePlayer}
          onTransferHost={handleTransferHost}
          onDeleteGame={handleDeleteGame}
          onGameUpdated={(updatedGame) => {
            // Update the selected game with fresh data
            if (updatedGame) {
              setSelectedGame(updatedGame)
            } else {
              setSelectedGame(null)
            }
            // Also refresh the games list
            refetch()
          }}
          onEdit={handleEditGame}
        />
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <EditGameModal
          isOpen={!!editingGame}
          onClose={() => setEditingGame(null)}
          game={editingGame}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}
