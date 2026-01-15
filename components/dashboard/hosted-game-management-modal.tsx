"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, X, Check, Users, ExternalLink, Loader2, Edit, Crown, CheckCircle2, Trophy } from "lucide-react"
import type { Game, JoinRequest, Player, UserProfile } from "@/lib/db/models/types/game"
import Image from "next/image"
import { formatLocationForDisplay } from "@/lib/utils/location"
import { useState, useEffect, useMemo } from "react"
import { getGameById, leaveGame } from "@/lib/api/games"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useDialog } from "@/lib/utils/dialog"
import { AttendanceModal } from "@/components/dashboard/attendance-modal"
import { PublicUserProfileModal } from "@/components/dashboard/public-user-profile-modal"
import { InlineGameChat } from "@/components/dashboard/inline-game-chat"

interface HostedGameManagementModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onAcceptRequest: (gameId: string, requestId: string) => void
  onRejectRequest: (gameId: string, requestId: string) => void
  onRemovePlayer: (gameId: string, playerId: string) => void
  onTransferHost?: (gameId: string, newHostId: string) => void // Callback to transfer host
  onGameUpdated?: (updatedGame: Game) => void // Callback when game data is updated
  onEdit?: (game: Game) => void // Callback to open edit modal
  onDeleteGame?: (gameId: string) => void // Callback to delete game
}

export function HostedGameManagementModal({
  game,
  isOpen,
  onClose,
  onAcceptRequest,
  onRejectRequest,
  onRemovePlayer,
  onTransferHost,
  onDeleteGame,
  onGameUpdated,
  onEdit,
}: HostedGameManagementModalProps) {
  const { data: session } = useSession()
  const { confirm } = useDialog()
  const [currentGame, setCurrentGame] = useState<Game>(game)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null)
  
  // Handle player click to view profile
  const handlePlayerClick = (player: Player | JoinRequest | any) => {
    // Pass minimal user profile data - the modal will fetch full profile
    const userProfile: UserProfile = {
      id: player.userId || player.id || '',
      name: player.name || player.userName,
      age: player.age || player.userAge,
      skillLevel: player.skillLevel || player.userSkillLevel || '',
      image: player.image || player.userImage || '/placeholder.svg',
      whatsApp: player.whatsApp || player.userWhatsApp || '',
      bio: '',
      gamesPlayed: 0,
      rating: 0,
    }
    setSelectedUserProfile(userProfile)
  }
  
  // Check if current user is the host
  const isCurrentUserHost = session?.user?.id && currentGame.hostId === session.user.id
  
  // Check if current user is a registered player (including old host who transferred)
  const isCurrentUserPlayer = useMemo(() => {
    if (!session?.user?.id || !currentGame.registeredPlayers) return false
    return currentGame.registeredPlayers.some(
      (player: any) => {
        const playerUserId = player.userId?.toString() || player.userId || player.id
        return playerUserId === session.user.id
      }
    )
  }, [currentGame.registeredPlayers, session?.user?.id])

  // Check if user can chat (host or registered player)
  const canChat = isCurrentUserHost || isCurrentUserPlayer

  // Check if current user has a pending join request
  const hasPendingJoinRequest = useMemo(() => {
    if (!session?.user?.id || !currentGame.joinRequests) return false
    return currentGame.joinRequests.some(
      (request: any) => {
        const requestUserId = request.userId?.toString() || request.userId || request.id
        return requestUserId === session.user.id
      }
    )
  }, [currentGame.joinRequests, session?.user?.id])

  // Helper to check if a player has attended
  const hasPlayerAttended = (playerId: string) => {
    const attendance = (currentGame as any).attendance || []
    const playerAttendance = attendance.find((att: any) => 
      att.userId?.toString() === playerId || att.userId === playerId
    )
    return playerAttendance?.attended || false
  }

  // Refresh game data when modal opens to get latest join requests
  useEffect(() => {
    if (isOpen && game.id) {
      fetchGameData()
    }
  }, [isOpen, game.id])

  // Update current game when prop changes
  useEffect(() => {
    const gameData = { ...game } as any
    // Normalize time fields: ensure both time and startTime are set
    if (gameData.startTime && !gameData.time) {
      gameData.time = gameData.startTime
    }
    setCurrentGame(gameData)
  }, [game])

  const fetchGameData = async () => {
    setIsLoadingGame(true)
    try {
      const response = await getGameById(game.id)
      if (response.success && response.data) {
        const gameData = response.data as any
        // Normalize time fields: ensure both time and startTime are set
        if (gameData.startTime && !gameData.time) {
          gameData.time = gameData.startTime
        }
        setCurrentGame(gameData)
        // Notify parent component of updated game data
        if (onGameUpdated) {
          onGameUpdated(gameData)
        }
      }
    } catch (error) {
      console.error('Error fetching game:', error)
    } finally {
      setIsLoadingGame(false)
    }
  }

  // Format date and time for display
  const formatDate = (date: string | Date) => {
    if (!date) return 'Date not set'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatTime = (time: string) => {
    if (!time) return 'Time not set'
    // If time is in HH:mm format, convert to 12-hour format
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    }
    return time
  }

  // Check if game time has arrived (for showing attendance button)
  const isGameTimeArrived = useMemo(() => {
    if (!currentGame.date) return false
    
    // Get time string (could be in time field or startTime)
    const timeStr = currentGame.time || (currentGame as any).startTime || ''
    if (!timeStr) return false
    
    try {
      let gameDate: Date
      
      // Handle "Today" string or actual date
      if (typeof currentGame.date === 'string' && currentGame.date.toLowerCase() === 'today') {
        gameDate = new Date() // Use today's date
      } else {
        // Try to parse the date string
        gameDate = new Date(currentGame.date)
        // If invalid, try to get from API response
        if (isNaN(gameDate.getTime())) {
          // Try to get original date from API response if available
          const originalDate = (currentGame as any).originalDate || (currentGame as any).date
          if (originalDate) {
            gameDate = new Date(originalDate)
          } else {
            return false
          }
        }
      }
      
      const [hours, minutes] = timeStr.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) return false
      
      // Create game start datetime
      const gameStartDateTime = new Date(gameDate)
      gameStartDateTime.setHours(hours, minutes, 0, 0)
      
      // Check if current time is past game start time
      const now = new Date()
      return now >= gameStartDateTime
    } catch (error) {
      console.error('Error checking game time:', error)
      return false
    }
  }, [currentGame.date, currentGame.time, (currentGame as any).startTime])

  // Check if game is ongoing or completed
  // For now, allow hosts to mark attendance anytime (we can refine this later)
  const canMarkAttendance = isCurrentUserHost && (
    currentGame.status === 'ongoing' || 
    currentGame.status === 'completed' || 
    isGameTimeArrived ||
    true // Temporarily always show for hosts to test
  )

  // Check if game is completed
  const isGameCompleted = currentGame.status === 'completed'

  // Debug log to help troubleshoot
  useEffect(() => {
    if (isOpen && isCurrentUserHost) {
      console.log('Attendance button check:', {
        isCurrentUserHost,
        status: currentGame.status,
        isGameTimeArrived,
        canMarkAttendance,
        date: currentGame.date,
        time: currentGame.time,
        startTime: (currentGame as any).startTime,
        originalDate: (currentGame as any).originalDate,
      })
    }
  }, [isOpen, isCurrentUserHost, currentGame.status, isGameTimeArrived, canMarkAttendance, currentGame.date, currentGame.time])

  const handleLeaveGame = async () => {
    const confirmed = await confirm('Are you sure you want to leave this game?', {
      title: 'Leave Game',
      message: 'Are you sure you want to leave this game?',
      variant: 'destructive',
      confirmText: 'Leave',
      cancelText: 'Cancel',
    })
    if (!confirmed) {
      return
    }

    try {
      const response = await leaveGame(currentGame.id)
      if (response.success) {
        toast.success('Successfully left the game')
        onClose()
        // Notify parent to refresh
        if (onGameUpdated) {
          // Game might be deleted if host left with no players
          onGameUpdated(null as any)
        }
      } else {
        toast.error(response.error || 'Failed to leave game')
      }
    } catch (error: any) {
      console.error('Error leaving game:', error)
      toast.error('Failed to leave game. Please try again.')
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold">{currentGame.sport.toUpperCase()}</DialogTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {hasPendingJoinRequest && (
                <Badge className="bg-orange-500 text-white text-xs sm:text-sm">
                  Pending Request
                </Badge>
              )}
              {isCurrentUserHost && currentGame.joinRequests && currentGame.joinRequests.length > 0 && (
                <Badge className="bg-orange-500 text-white text-xs sm:text-sm">
                  {currentGame.joinRequests.length} pending request{currentGame.joinRequests.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Game Image */}
          <div className="relative">
            <Image
              src={game.image || "/placeholder.svg"}
              alt={game.title}
              width={800}
              height={200}
              className="w-full h-32 sm:h-48 object-cover rounded-lg"
            />
          </div>

          {/* Game Details */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base text-gray-600">
              {currentGame.description || "No description provided"}
            </p>

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

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Time: {(() => {
                  const startTime = currentGame.time || (currentGame as any).startTime
                  if (!startTime && !currentGame.endTime) return 'Time not set'
                  if (startTime && currentGame.endTime) {
                    return `${formatTime(startTime)} - ${formatTime(currentGame.endTime)}`
                  }
                  if (startTime) return formatTime(startTime)
                  if (currentGame.endTime) return `Until ${formatTime(currentGame.endTime)}`
                  return 'Time not set'
                })()}</span>
              </div>
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

          <div className={`grid gap-4 sm:gap-6 ${isCurrentUserHost ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
            {/* Players Section */}
            <div className={isCurrentUserHost ? 'lg:col-span-2' : ''}>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                  <h4 className="font-bold text-base sm:text-lg">Players</h4>
                  <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">
                      {((currentGame.registeredPlayers?.length || 0) + 1)} / {currentGame.maxPlayers || ((currentGame.seatsLeft || 0) + (currentGame.registeredPlayers?.length || 0) + 1)}
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
                              // Create a host player object for the click handler
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
                                  {currentGame.hostId && hasPlayerAttended(currentGame.hostId) && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs flex items-center gap-1 flex-shrink-0">
                                      <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      <span className="hidden sm:inline">Attended</span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Regular players */}
                      {currentGame.registeredPlayers && currentGame.registeredPlayers.length > 0 && (
                        // Deduplicate players by userId to prevent showing same user twice
                        Array.from(
                          new Map(
                            currentGame.registeredPlayers.map((player: any) => {
                              const userId = player.userId?.toString() || player.userId || player.id
                              return [userId, player]
                            })
                          ).values()
                        ).map((player: any) => (
                          <div key={player.id || player.userId} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg gap-2">
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
                              <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base flex items-center gap-1 sm:gap-2 flex-wrap">
                              <span className="truncate">{player.name}</span>
                              {hasPlayerAttended(player.userId || player.id) && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs flex items-center gap-1 flex-shrink-0">
                                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="hidden sm:inline">Attended</span>
                                </Badge>
                              )}
                            </div>
                            {(player.age || player.skillLevel) && (
                              <div className="text-xs sm:text-sm text-gray-600 truncate">
                                {player.age && `${player.age} years`}
                                {player.age && player.skillLevel && ' • '}
                                {player.skillLevel && player.skillLevel}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Only show action buttons if user is host */}
                        {isCurrentUserHost && (
                          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                            {onTransferHost && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-yellow-600 hover:bg-yellow-100"
                              onClick={async (e) => {
                                e.stopPropagation()
                                const confirmed = await confirm(`Transfer host ownership to ${player.name}? You will become a regular player and can then leave the game.`, {
                                  title: 'Transfer Host Ownership',
                                  message: `Transfer host ownership to ${player.name}? You will become a regular player and can then leave the game.`,
                                  confirmText: 'Transfer',
                                  cancelText: 'Cancel',
                                })
                                if (confirmed) {
                                  // Use userId if available, otherwise use id (which should be userId)
                                  const playerUserId = player.userId || player.id
                                  if (playerUserId) {
                                    onTransferHost(currentGame.id, playerUserId)
                                  } else {
                                    toast.error('Unable to identify player. Please refresh and try again.')
                                  }
                                }
                              }}
                                title="Transfer host ownership"
                              >
                                <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:bg-red-100"
                              onClick={async (e) => {
                                e.stopPropagation()
                                // Use userId if available, otherwise use id (which should be userId)
                                const playerUserId = player.userId || player.id
                                if (playerUserId) {
                                  onRemovePlayer(currentGame.id, playerUserId)
                                } else {
                                  toast.error('Unable to identify player. Please refresh and try again.')
                                }
                              }}
                              title="Remove player"
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        )}
                        </div>
                      ))
                      )}
                      {(!currentGame.registeredPlayers || currentGame.registeredPlayers.length === 0) && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          <p>No other players joined yet</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Join Requests Section - Only visible to host */}
            {isCurrentUserHost && (
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                  <h4 className="font-bold text-base sm:text-lg">JOIN REQUESTS</h4>
                  <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">{currentGame.seatsLeft || 0} seats left</span>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-4">
                  {isLoadingGame ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                    </div>
                  ) : currentGame.joinRequests && currentGame.joinRequests.length > 0 ? (
                    currentGame.joinRequests.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors gap-2">
                        <div
                          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 p-1 sm:p-2 rounded flex-1 min-w-0"
                          onClick={() => handlePlayerClick(request)}
                        >
                          {request.userImage ? (
                            <Image
                              src={request.userImage}
                              alt={request.userName || request.name}
                              width={40}
                              height={40}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{(request.userName || request.name || 'U').charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base truncate">{request.userName || request.name || 'Unknown User'}</div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">
                              {request.userAge && `${request.userAge} years`}
                              {request.userAge && request.userSkillLevel && ' • '}
                              {request.userSkillLevel && request.userSkillLevel}
                              {!request.userAge && !request.userSkillLevel && 'No additional info'}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              await onAcceptRequest(currentGame.id, request.id)
                              // Refresh game data after accepting
                              setTimeout(() => fetchGameData(), 500)
                            }}
                            title="Accept request"
                          >
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={async () => {
                              await onRejectRequest(currentGame.id, request.id)
                              // Refresh game data after rejecting
                              setTimeout(() => fetchGameData(), 500)
                            }}
                            title="Reject request"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No pending requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Game Chat - Inline inside modal (only visible to hosts and registered players, not pending requests) */}
          {!hasPendingJoinRequest && canChat && (
            <InlineGameChat 
              gameId={currentGame.id} 
              isPlayer={canChat}
              hasPendingRequest={false}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Game Completed button - shown when game is completed */}
              {isGameCompleted && isCurrentUserHost && (
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                  disabled
                >
                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Game Completed
                </Button>
              )}
              {/* Mark Attendance button - only visible to host when game is not completed */}
              {canMarkAttendance && !isGameCompleted && (
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => setShowAttendanceModal(true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Mark Attendance
                </Button>
              )}
              {/* Edit button - only visible to host */}
              {isCurrentUserHost && onEdit && !isGameCompleted && (
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => {
                    onEdit(currentGame)
                    onClose()
                  }}
                >
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Edit Game
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Show Leave button for players (including old host who transferred) */}
              {(isCurrentUserPlayer || isCurrentUserHost) && (
                <Button 
                  variant="destructive" 
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm sm:text-base"
                  disabled={!!(isCurrentUserHost && (currentGame.registeredPlayers?.length || 0) > 0)}
                  onClick={handleLeaveGame}
                  title={isCurrentUserHost && (currentGame.registeredPlayers?.length || 0) > 0 
                    ? "Transfer host ownership to a player first before leaving" 
                    : "Leave game"}
                >
                  Leave
                </Button>
              )}
              {/* Show Delete button only for current host */}
              {isCurrentUserHost && onDeleteGame && (
                <Button 
                  variant="destructive" 
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm sm:text-base"
                  onClick={async () => {
                    const confirmed = await confirm('Are you sure you want to delete this game?', {
                      title: 'Delete Game',
                      message: 'Are you sure you want to delete this game? This action cannot be undone.',
                      variant: 'destructive',
                      confirmText: 'Delete',
                      cancelText: 'Cancel',
                    })
                    if (confirmed) {
                      onDeleteGame(currentGame.id)
                      onClose()
                    }
                  }}
                  title="Delete game"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <AttendanceModal
          game={currentGame}
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          onAttendanceMarked={(updatedGame) => {
            setCurrentGame(updatedGame)
            if (onGameUpdated) {
              onGameUpdated(updatedGame)
            }
            setShowAttendanceModal(false)
          }}
        />
      )}
    </Dialog>

    {/* Public User Profile Modal */}
    {selectedUserProfile && (
      <PublicUserProfileModal
        user={selectedUserProfile}
        isOpen={!!selectedUserProfile}
        onClose={() => setSelectedUserProfile(null)}
        game={currentGame.status === 'upcoming' ? currentGame : null}
      />
    )}
    </>
  )
}
