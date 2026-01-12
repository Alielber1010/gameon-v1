"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Users, Loader2, Trophy, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { markAttendance } from "@/lib/api/games"
import { toast } from "sonner"
import Image from "next/image"
import type { Game, Player } from "@/lib/db/models/types/game"
import { useDialog } from "@/lib/utils/dialog"

interface AttendanceModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onAttendanceMarked?: (updatedGame: Game) => void
}

export function AttendanceModal({ game, isOpen, onClose, onAttendanceMarked }: AttendanceModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
  const [isMarking, setIsMarking] = useState(false)
  const { confirm } = useDialog()

  // Get all players (host + registered players)
  const allPlayers: Array<Player & { userId: string; isHost?: boolean }> = [
    {
      id: game.hostId || '',
      userId: game.hostId || '',
      name: game.hostName || 'Host',
      image: game.hostImage,
      isHost: true,
    } as any,
    ...(game.registeredPlayers || []).map((p: any) => ({
      ...p,
      userId: p.userId || p.id,
    })),
  ]

  // Get attendance status for each player
  const getAttendanceStatus = (playerId: string) => {
    const attendance = (game as any).attendance || []
    const playerAttendance = attendance.find((att: any) => 
      att.userId?.toString() === playerId || att.userId === playerId
    )
    return playerAttendance?.attended || false
  }

  const togglePlayer = (playerId: string) => {
    const newSet = new Set(selectedPlayerIds)
    if (newSet.has(playerId)) {
      newSet.delete(playerId)
    } else {
      newSet.add(playerId)
    }
    setSelectedPlayerIds(newSet)
  }

  const handleMarkAll = () => {
    const allIds = allPlayers.map(p => p.userId || p.id).filter(Boolean) as string[]
    setSelectedPlayerIds(new Set(allIds))
  }

  const handleClearAll = () => {
    setSelectedPlayerIds(new Set())
  }

  // Check if game is already completed
  const isGameCompleted = (game as any).status === 'completed'

  const handleMarkAttendance = async (markAll: boolean = false) => {
    // Check if this action will complete the game (all players will be marked as attended)
    const currentlyAttended = allPlayers.filter(p => {
      const playerId = p.userId || p.id
      return getAttendanceStatus(playerId)
    }).length

    const playersToMark = markAll 
      ? allPlayers.length - currentlyAttended 
      : selectedPlayerIds.size

    const willCompleteGame = (currentlyAttended + playersToMark) >= allPlayers.length

    // If this will complete the game, ask for confirmation
    if (willCompleteGame && !isGameCompleted) {
      const confirmed = await confirm(
        'This will mark all players as attended and complete the game. Are you sure?',
        {
          title: 'Complete Game?',
          message: 'Once all players are marked as attended, the game will be completed and players will be able to rate each other. This action cannot be undone.',
          confirmText: 'Yes, Complete Game',
          cancelText: 'Cancel',
          variant: 'default',
        }
      )

      if (!confirmed) {
        return // User cancelled
      }
    }

    setIsMarking(true)
    try {
      const playerIds = markAll ? undefined : Array.from(selectedPlayerIds)
      const response = await markAttendance(game.id, playerIds, markAll)

      if (response.success && response.data) {
        const updatedGame = response.data as any
        const isCompleted = updatedGame.status === 'completed'
        
        if (isCompleted) {
          // Show game completed confirmation
          toast.success('🎉 Game Completed! All players have been marked as attended.', {
            duration: 5000,
          })
        } else {
          toast.success(markAll 
            ? 'All players marked as attended!' 
            : `${selectedPlayerIds.size} player(s) marked as attended!`
          )
        }
        
        setSelectedPlayerIds(new Set())
        if (onAttendanceMarked) {
          onAttendanceMarked(updatedGame)
        }
        onClose()
      } else {
        toast.error(response.error || 'Failed to mark attendance')
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance. Please try again.')
    } finally {
      setIsMarking(false)
    }
  }

  const allMarked = allPlayers.every(p => {
    const playerId = p.userId || p.id
    return getAttendanceStatus(playerId)
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isGameCompleted ? (
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Game Completed
              </div>
            ) : (
              'Mark Attendance'
            )}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            {isGameCompleted 
              ? 'All players have been marked as attended. The game is now completed!'
              : 'Select players who attended the game. They will receive a notification.'
            }
          </p>
        </DialogHeader>

        {isGameCompleted && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-bold text-green-800">Game Successfully Completed!</h4>
                <p className="text-sm text-green-700 mt-1">
                  All players have been notified. They can now rate each other.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={isMarking}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={isMarking}
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAttendance(true)}
              disabled={isMarking || allMarked}
              className="ml-auto bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
            >
              Mark All as Attended
            </Button>
          </div>

          {/* Players List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {allPlayers.map((player) => {
              const playerId = player.userId || player.id
              const isSelected = selectedPlayerIds.has(playerId)
              const isAttended = getAttendanceStatus(playerId)

              return (
                <div
                  key={playerId}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border-2 transition-all
                    ${isAttended 
                      ? 'bg-green-50 border-green-200' 
                      : isSelected 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-white border-gray-200 hover:border-green-300'
                    }
                  `}
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
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {player.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        {player.isHost && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                            Host
                          </Badge>
                        )}
                        {isAttended && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            Attended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isAttended && (
                    <button
                      type="button"
                      onClick={() => togglePlayer(playerId)}
                      className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center transition-all
                        ${isSelected 
                          ? 'bg-green-600 border-green-600' 
                          : 'bg-white border-gray-300 hover:border-green-500'
                        }
                      `}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {isGameCompleted ? (
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Game Completed
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} disabled={isMarking}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleMarkAttendance(false)}
                  disabled={isMarking || selectedPlayerIds.size === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isMarking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Mark {selectedPlayerIds.size} Player{selectedPlayerIds.size !== 1 ? 's' : ''} as Attended
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

