"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, Users, ExternalLink, Flag, Star, Trophy, Crown, CheckCircle2 } from "lucide-react"
import type { Game, Player } from "@/lib/db/models/types/game"
import Image from "next/image"
import { formatLocationForDisplay } from "@/lib/utils/location"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ratePlayer } from "@/lib/api/games"
import { toast } from "sonner"
import { RatingModal } from "@/components/dashboard/rating-modal"
import { PublicUserProfileModal } from "@/components/dashboard/public-user-profile-modal"
import type { UserProfile } from "@/lib/db/models/types/game"

interface CompletedGameDetailsModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onReport: () => void
  onGameUpdated?: (updatedGame: Game) => void
}

export function CompletedGameDetailsModal({
  game,
  isOpen,
  onClose,
  onReport,
  onGameUpdated,
}: CompletedGameDetailsModalProps) {
  const { data: session } = useSession()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [ratingPlayer, setRatingPlayer] = useState<Player | null>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null)
  const [currentGame, setCurrentGame] = useState<Game>(game)
  
  // Update currentGame when game prop changes
  useEffect(() => {
    setCurrentGame(game)
  }, [game])

  // Get all players (host + registered players)
  const allPlayers: Array<Player & { userId: string; isHost?: boolean }> = [
    {
      id: currentGame.hostId || '',
      userId: currentGame.hostId || '',
      name: currentGame.hostName || 'Host',
      image: currentGame.hostImage,
      isHost: true,
    } as any,
    ...(currentGame.registeredPlayers || []).map((p: any) => ({
      ...p,
      userId: p.userId || p.id,
    })),
  ]

  // Filter out current user from players list
  const otherPlayers = allPlayers.filter((p) => {
    const playerUserId = p.userId || p.id
    return playerUserId !== session?.user?.id
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

  const handlePlayerClick = (player: Player) => {
    // Pass minimal user profile data - the modal will fetch full profile
    setSelectedUserProfile({
      id: player.userId || player.id || '',
      name: player.name,
      age: player.age,
      skillLevel: player.skillLevel || '',
      image: player.image || '/placeholder.svg?height=96&width=96',
      whatsApp: player.whatsApp || '',
      bio: '',
      gamesPlayed: 0,
      rating: 0,
    })
  }

  const handleRatePlayer = (player: Player) => {
    setRatingPlayer(player)
  }

  const handleRatingSubmitted = async (rating: number, comment?: string): Promise<boolean> => {
    if (!ratingPlayer) return false

    const playerId = ratingPlayer.userId || ratingPlayer.id
    if (!playerId) return false

    console.log('[MODAL] Submitting rating for player:', playerId, 'Current playersRated:', currentGame.playersRated)

    try {
      const response = await ratePlayer(currentGame.id, playerId, rating, comment)
      if (response.success) {
        console.log('[MODAL] Rating submitted successfully')
        
        // Show success message
        toast.success(`Rating submitted for ${ratingPlayer.name}!`, {
          duration: 2000,
        })
        
        // Update the game to mark this player as rated - update local state immediately
        const updatedPlayersRated = [...(currentGame.playersRated || []), playerId]
        const updatedGame = {
          ...currentGame,
          playersRated: updatedPlayersRated,
        }
        
        console.log('[MODAL] Updated playersRated:', updatedPlayersRated)
        
        // Update local state immediately for instant UI feedback
        setCurrentGame(updatedGame as Game)
        
        // Update the parent component
        if (onGameUpdated) {
          onGameUpdated(updatedGame as Game)
        }
        
        // Close the rating modal
        setRatingPlayer(null)
        
        // Return true to indicate success - modal will close in RatingModal
        return true
      } else {
        console.error('[MODAL] Rating failed:', response.error)
        toast.error(response.error || 'Failed to submit rating')
        return false
      }
    } catch (error: any) {
      console.error('[MODAL] Error submitting rating:', error)
      toast.error('Failed to submit rating. Please try again.')
      return false
    }
  }

  // Check attendance status
  const hasPlayerAttended = (playerId: string) => {
    const attendance = (currentGame as any).attendance || []
    const playerAttendance = attendance.find((att: any) => 
      att.userId?.toString() === playerId || att.userId === playerId
    )
    return playerAttendance?.attended || false
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                {currentGame.sport.toUpperCase()} - Completed
              </DialogTitle>
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Game Image */}
            <div className="relative">
              <Image
                src={currentGame.image || "/placeholder.svg"}
                alt={currentGame.title}
                width={800}
                height={200}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            {/* Game Details */}
            <div className="space-y-4">
              <p className="text-gray-600">{currentGame.description || "No description provided"}</p>

              <div className="flex flex-wrap gap-6 text-sm">
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

                {currentGame.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Time: {formatTime(currentGame.time)} {currentGame.endTime && `- ${formatTime(currentGame.endTime)}`}</span>
                  </div>
                )}

                {(currentGame as any).completedAt && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>Completed: {formatDate((currentGame as any).completedAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {(() => {
                  const locationDisplay = formatLocationForDisplay(currentGame.location)
                  if (locationDisplay.isLink && locationDisplay.url) {
                    return (
                      <a
                        href={locationDisplay.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                      >
                        {locationDisplay.text}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )
                  }
                  return <span>{locationDisplay.text}</span>
                })()}
              </div>
            </div>

            {/* Players Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg">Players - Rate & Review</h4>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {allPlayers.length} / {currentGame.maxPlayers || allPlayers.length} players
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Rate players you played with. Your ratings help build a better community!
              </p>
              <div className="space-y-3">
                {otherPlayers.map((player) => {
                  const playerId = player.userId || player.id
                  const isAttended = hasPlayerAttended(playerId)
                  const hasRated = (currentGame as any).playersRated?.includes(playerId) || false

                  return (
                    <div
                      key={playerId}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {player.image ? (
                          <Image
                            src={player.image}
                            alt={player.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {player.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {player.isHost && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                Host
                              </Badge>
                            )}
                            {isAttended && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Attended
                              </Badge>
                            )}
                          </div>
                          {(player.age || player.skillLevel) && (
                            <div className="text-sm text-gray-600">
                              {player.age && `${player.age} years`}
                              {player.age && player.skillLevel && ' • '}
                              {player.skillLevel && player.skillLevel}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayerClick(player)}
                          className="flex items-center gap-1"
                        >
                          View Profile
                        </Button>
                        {hasRated ? (
                          <Button
                            size="sm"
                            disabled
                            className="bg-gray-300 text-gray-600 cursor-not-allowed flex items-center gap-1"
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            Rated
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleRatePlayer(player)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1"
                          >
                            <Star className="h-4 w-4" />
                            Rate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onReport()
                            onClose()
                          }}
                          className="flex items-center gap-1"
                        >
                          <Flag className="h-4 w-4" />
                          Report
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onReport} className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Report Game
              </Button>
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      {ratingPlayer && (
        <RatingModal
          player={ratingPlayer}
          game={currentGame}
          isOpen={!!ratingPlayer}
          onClose={() => setRatingPlayer(null)}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <PublicUserProfileModal
          user={selectedUserProfile}
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
        />
      )}
    </>
  )
}

