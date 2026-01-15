"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, MessageCircle, Flag, Users, ExternalLink, Crown, Loader2 } from "lucide-react"
import { PublicUserProfileModal } from "./public-user-profile-modal"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Game, UserProfile, Player } from "@/lib/db/models/types/game"
import Image from "next/image"
import { formatLocationForDisplay } from "@/lib/utils/location"
import { joinGame, getGameById } from "@/lib/api/games"
import { toast } from "sonner"

interface GameDetailsModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onReport: () => void
  onGameUpdated?: (updatedGame?: Game) => void
}

export function GameDetailsModal({ game, isOpen, onClose, onReport, onGameUpdated }: GameDetailsModalProps) {
  const { data: session } = useSession()
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [currentGame, setCurrentGame] = useState<Game>(game)
  const [isJoining, setIsJoining] = useState(false)
  const [isLoadingGame, setIsLoadingGame] = useState(false)

  // Update current game when prop changes
  useEffect(() => {
    setCurrentGame(game)
  }, [game])

  // Refresh game data when modal opens
  useEffect(() => {
    if (isOpen && game.id) {
      fetchGameData()
    }
  }, [isOpen, game.id])

  const fetchGameData = async () => {
    setIsLoadingGame(true)
    try {
      const response = await getGameById(game.id)
      if (response.success && response.data) {
        setCurrentGame(response.data as any)
        if (onGameUpdated) {
          onGameUpdated(response.data as any)
        }
      }
    } catch (error) {
      console.error('Error fetching game:', error)
    } finally {
      setIsLoadingGame(false)
    }
  }


  const handlePlayerClick = (player: Player | { id?: string; userId?: string; name: string; image?: string; whatsApp?: string; age?: number; skillLevel?: string }) => {
    // Pass minimal user profile data - the modal will fetch full profile
    const userProfile: UserProfile = {
      id: player.userId || player.id || '',
      name: player.name,
      age: player.age,
      skillLevel: player.skillLevel || '',
      image: player.image || '/placeholder.svg?height=96&width=96',
      whatsApp: player.whatsApp || '',
      bio: '',
      gamesPlayed: 0,
      rating: 0,
    }
    setSelectedUser(userProfile)
  }

  const handleJoinGame = async () => {
    if (!session?.user) {
      toast.error('Please login to join a game')
      return
    }

    setIsJoining(true)
    try {
      const playerData = {
        name: session.user.name || 'User',
        age: undefined, // Can be added later if needed
        skillLevel: undefined, // Can be added later if needed
        image: session.user.image || undefined,
        whatsApp: undefined, // Can be added later if needed
      }

      const response = await joinGame(currentGame.id, playerData)
      
      if (response.success) {
        toast.success('Join request sent! The host will review your request.')
        // Refresh game data
        await fetchGameData()
        if (onGameUpdated && response.data) {
          onGameUpdated(response.data as any)
        }
      } else {
        toast.error(response.error || 'Failed to join game')
      }
    } catch (error: any) {
      console.error('Error joining game:', error)
      toast.error('Failed to join game. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  // Get all players (host + registered players) and deduplicate by userId
  const registeredPlayersDeduped = Array.from(
    new Map(
      (currentGame.registeredPlayers || []).map((p: any) => {
        const userId = p.userId?.toString() || p.userId || p.id
        return [userId, {
          ...p,
          userId: userId,
        }]
      })
    ).values()
  )

  const allPlayers: Array<Player & { userId: string; isHost?: boolean }> = [
    {
      id: currentGame.hostId || '',
      userId: currentGame.hostId || '',
      name: currentGame.hostName || 'Host',
      image: currentGame.hostImage,
      whatsApp: currentGame.hostWhatsApp,
      isHost: true,
    } as any,
    ...registeredPlayersDeduped,
  ]

  // Check if current user is already a player
  const isCurrentUserPlayer = session?.user?.id && (
    currentGame.hostId === session.user.id ||
    currentGame.registeredPlayers?.some((p: any) => {
      const playerUserId = p.userId?.toString() || p.userId || p.id
      return playerUserId === session.user.id
    })
  )

  // Check if current user has a pending join request
  const hasPendingJoinRequest = currentGame.joinRequests?.some((request: any) => {
    const requestUserId = request.userId?.toString() || request.userId || request.id
    return requestUserId === session?.user?.id
  })

  const formatDate = (date: string | Date) => {
    if (!date) return 'Date not set'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (time: string) => {
    if (!time) return 'Time not set'
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    }
    return time
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">{currentGame.sport.toUpperCase()}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Game Image */}
            <div className="relative">
              <Image
                src={currentGame.image || "/placeholder.svg"}
                alt={currentGame.title}
                width={800}
                height={200}
                className="w-full h-32 sm:h-48 object-cover rounded-lg"
              />
            </div>

            {/* Game Details */}
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-gray-600">{currentGame.description || "No description provided"}</p>

              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>🎯</span>
                    Skill level: {currentGame.skillLevel || 'all'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date: {formatDate(currentGame.date)}</span>
                </div>

                {(currentGame.time || currentGame.endTime) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {currentGame.time 
                        ? (currentGame.endTime 
                            ? `${formatTime(currentGame.time)} - ${formatTime(currentGame.endTime)}`
                            : formatTime(currentGame.time))
                        : (currentGame.endTime 
                            ? `Until ${formatTime(currentGame.endTime)}`
                            : 'Time not set')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-start sm:items-center gap-2">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 sm:mt-0 flex-shrink-0" />
                {(() => {
                  const locationDisplay = formatLocationForDisplay(currentGame.location)
                  if (locationDisplay.isLink && locationDisplay.url) {
                    return (
                      <a
                        href={locationDisplay.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 text-xs sm:text-sm break-words"
                      >
                        <span className="break-words">{locationDisplay.text}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    )
                  }
                  return <span className="text-xs sm:text-sm break-words">{locationDisplay.text}</span>
                })()}
              </div>
            </div>

            {/* Players Section */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h4 className="font-bold text-base sm:text-lg">Players</h4>
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    {allPlayers.length} / {currentGame.maxPlayers || allPlayers.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {isLoadingGame ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : (
                  <>
                    {/* Host at the top */}
                    {currentGame.hostName && (
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border-2 border-yellow-200">
                        <div
                          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 p-1 sm:p-2 rounded flex-1 min-w-0"
                          onClick={() => {
                            const hostPlayer: any = {
                              id: currentGame.hostId,
                              userId: currentGame.hostId,
                              name: currentGame.hostName,
                              image: currentGame.hostImage,
                              whatsApp: currentGame.hostWhatsApp,
                              isHost: true,
                            }
                            handlePlayerClick(hostPlayer)
                          }}
                        >
                          {currentGame.hostImage ? (
                            <Image
                              src={currentGame.hostImage}
                              alt={currentGame.hostName}
                              width={40}
                              height={40}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{currentGame.hostName?.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base flex items-center gap-1 sm:gap-2 flex-wrap">
                                <span className="truncate">{currentGame.hostName}</span>
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs flex items-center gap-1 flex-shrink-0">
                                  <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="hidden sm:inline">Host</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Regular players */}
                    {currentGame.registeredPlayers && currentGame.registeredPlayers.length > 0 && (
                      currentGame.registeredPlayers.map((player: any) => (
                        <div key={player.id || player.userId} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg">
                          <div
                            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 p-1 sm:p-2 rounded flex-1 min-w-0"
                            onClick={() => handlePlayerClick(player)}
                          >
                            {player.image ? (
                              <Image
                                src={player.image}
                                alt={player.name}
                                width={40}
                                height={40}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{player.name?.charAt(0)}</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base truncate">{player.name}</div>
                              {(player.age || player.skillLevel) && (
                                <div className="text-xs sm:text-sm text-gray-600 truncate">
                                  {player.age && `${player.age} years`}
                                  {player.age && player.skillLevel && ' • '}
                                  {player.skillLevel && player.skillLevel}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {allPlayers.length === 1 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No other players yet. Be the first to join!
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onReport} className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base">
                <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Report
              </Button>

              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                {isCurrentUserPlayer ? (
                  <Button disabled className="bg-gray-400 w-full sm:w-auto text-sm sm:text-base">
                    Already Joined
                  </Button>
                ) : hasPendingJoinRequest ? (
                  <Button disabled className="bg-yellow-500 w-full sm:w-auto text-sm sm:text-base">
                    Pending Request
                  </Button>
                ) : (
                  <Button
                    onClick={handleJoinGame}
                    disabled={isJoining || (currentGame.seatsLeft || 0) <= 0}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Game'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Public User Profile Modal */}
      {selectedUser && (
        <PublicUserProfileModal 
          user={selectedUser} 
          isOpen={!!selectedUser} 
          onClose={() => setSelectedUser(null)}
          game={game.status === 'upcoming' ? game : null}
        />
      )}
    </>
  )
}
