"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, MessageCircle, ExternalLink, Users } from "lucide-react"
import { PublicUserProfileModal } from "./public-user-profile-modal"
import { InlineGameChat } from "./inline-game-chat"
import { useState } from "react"
import type { Game, UserProfile } from "@/lib/db/models/types/game"
import Image from "next/image"
import { formatLocationForDisplay } from "@/lib/utils/location"
import { useSession } from "next-auth/react"

interface UpcomingGameDetailsModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onLeaveGame: () => void
}

// Mock function to get user profile data
const getUserProfile = (playerName: string): UserProfile => {
  const profiles: { [key: string]: UserProfile } = {
    KHALED: {
      id: "user1",
      name: "KHALED",
      age: 28,
      skillLevel: "Intermediate",
      image: "/placeholder.svg?height=96&width=96",
      whatsApp: "https://wa.me/1234567890",
      bio: "Passionate football player who loves competitive matches and team spirit.",
      gamesPlayed: 23,
      rating: 4.2,
    },
    MOHAMED: {
      id: "user2",
      name: "MOHAMED",
      age: 24,
      skillLevel: "Beginner",
      image: "/placeholder.svg?height=96&width=96",
      whatsApp: "https://wa.me/1234567891",
      bio: "New to sports but eager to learn and improve my skills.",
      gamesPlayed: 8,
      rating: 3.8,
    },
    YOUSSEF: {
      id: "user3",
      name: "YOUSSEF",
      age: 30,
      skillLevel: "Advanced",
      image: "/placeholder.svg?height=96&width=96",
      whatsApp: "https://wa.me/1234567892",
      bio: "Experienced player who enjoys helping others improve their game.",
      gamesPlayed: 45,
      rating: 4.7,
    },
    NOUR: {
      id: "user4",
      name: "NOUR",
      age: 26,
      skillLevel: "Intermediate",
      image: "/placeholder.svg?height=96&width=96",
      whatsApp: "https://wa.me/1234567893",
      bio: "Love playing basketball and meeting new people through sports.",
      gamesPlayed: 19,
      rating: 4.1,
    },
    AHMED: {
      id: "user5",
      name: "AHMED",
      age: 23,
      skillLevel: "Professional",
      image: "/placeholder.svg?height=96&width=96",
      whatsApp: "https://wa.me/1234567894",
      bio: "Professional athlete who enjoys casual games with the community.",
      gamesPlayed: 67,
      rating: 4.9,
    },
    "ALI (YOU)": {
      id: "currentUser",
      name: "ALI",
      age: 27,
      skillLevel: "Intermediate",
      image: "/placeholder.svg?height=96&width=96",
      whatsApp: "https://wa.me/1234567895",
      bio: "Love playing various sports and meeting new teammates.",
      gamesPlayed: 32,
      rating: 4.3,
    },
  }

  return (
    profiles[playerName] || {
      id: "unknown",
      name: playerName.replace(" (YOU)", ""),
      age: 25,
      skillLevel: "Intermediate",
      image: "/placeholder.svg?height=96&width=96",
      whatsApp: "https://wa.me/1234567890",
      bio: "Sports enthusiast who loves playing games and staying active.",
      gamesPlayed: 15,
      rating: 4.0,
    }
  )
}

export function UpcomingGameDetailsModal({ game, isOpen, onClose, onLeaveGame }: UpcomingGameDetailsModalProps) {
  const { data: session } = useSession()
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)


  const handlePlayerClick = (player: any) => {
    // Pass minimal user profile data - the modal will fetch full profile
    const userProfile: UserProfile = {
      id: player.id || player.userId || '',
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

  // Get all players from registeredPlayers and deduplicate by userId
  const allPlayers = Array.from(
    new Map(
      (game.registeredPlayers || []).map((player: any) => {
        const userId = player.userId?.toString() || player.userId || player.id
        return [userId, {
          id: userId,
          name: player.name,
          age: player.age,
          skillLevel: player.skillLevel,
          image: player.image,
          whatsApp: player.whatsApp,
          isCurrentUser: userId === session?.user?.id,
        }]
      })
    ).values()
  )

  // Check if current user is a player or host
  const isCurrentUserPlayer = session?.user?.id && (
    game.hostId === session.user.id ||
    allPlayers.some((p) => p.id === session.user.id || p.isCurrentUser)
  )

  // Check if current user has a pending join request
  const hasPendingJoinRequest = session?.user?.id && game.joinRequests?.some((request: any) => {
    const requestUserId = request.userId?.toString() || request.userId || request.id
    return requestUserId === session.user.id
  })

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{game.sport.toUpperCase()}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Game Image */}
            <div className="relative">
              <Image
                src={game.image || "/placeholder.svg"}
                alt={game.title}
                width={800}
                height={200}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            {/* Game Description */}
            <div className="space-y-4">
              <p className="text-gray-600">
                Game Description: {game.description || "a friendly match in football we just wanna have a good time"}
              </p>

              {/* Game Details Row */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>🎯</span>
                    Skill level: {game.skillLevel}+
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>👥</span>
                    Age Range: 18-40
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date: Fri, May 16</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Time: 6:00 PM - 7:30 PM</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {(() => {
                  const locationDisplay = formatLocationForDisplay(game.location)
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
                <h4 className="font-bold text-lg">Players</h4>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {allPlayers.length} / {game.seatsLeft + allPlayers.length} players
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {allPlayers.length > 0 ? (
                  allPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                      onClick={() => handlePlayerClick(player)}
                    >
                      {player.image ? (
                        <Image
                          src={player.image}
                          alt={player.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          {player.isCurrentUser ? (
                            <MessageCircle className="h-4 w-4 text-white" />
                          ) : (
                            <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <span className={`font-medium hover:text-green-700 ${player.isCurrentUser ? "text-green-600" : ""}`}>
                          {player.name}
                          {player.isCurrentUser && ' (You)'}
                        </span>
                        {(player.age || player.skillLevel) && (
                          <div className="text-xs text-gray-500">
                            {player.age && `${player.age} years`}
                            {player.age && player.skillLevel && ' • '}
                            {player.skillLevel && player.skillLevel}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No players joined yet</p>
                )}
              </div>
            </div>

            {/* Game Chat - Inline inside modal (only visible to hosts and registered players, not pending requests) */}
            {!hasPendingJoinRequest && isCurrentUserPlayer && (
              <InlineGameChat 
                gameId={game.id} 
                isPlayer={isCurrentUserPlayer}
                hasPendingRequest={false}
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="destructive" onClick={onLeaveGame} className="bg-red-600 hover:bg-red-700">
                Leave Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Public User Profile Modal */}
      {selectedUser && (
        <PublicUserProfileModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  )
}
