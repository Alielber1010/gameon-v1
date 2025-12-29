"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, MessageCircle, Phone } from "lucide-react"
import { PublicUserProfileModal } from "./public-user-profile-modal"
import { useState } from "react"
import type { Game, UserProfile } from "@/types/game"
import Image from "next/image"

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
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  const handleChatHost = () => {
    window.open(game.hostWhatsApp, "_blank")
  }

  const handlePlayerClick = (playerName: string) => {
    const userProfile = getUserProfile(playerName)
    setSelectedUser(userProfile)
  }

  // Mock team data
  const teamData = {
    teamBlue: [
      { id: "1", name: "KHALED", isCurrentUser: false },
      { id: "2", name: "MOHAMED", isCurrentUser: false },
      { id: "3", name: "YOUSSEF", isCurrentUser: false },
    ],
    teamRed: [
      { id: "4", name: "NOUR", isCurrentUser: false },
      { id: "5", name: "AHMED", isCurrentUser: false },
      { id: "6", name: "ALI (YOU)", isCurrentUser: true },
    ],
  }

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
                <span>HappyGym, {game.location}</span>
              </div>
            </div>

            {/* Teams Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team Blue */}
              <div className="bg-blue-100 p-6 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-4 text-lg">TEAM BLUE</h4>
                <div className="space-y-3">
                  {teamData.teamBlue.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-blue-200 p-2 rounded transition-colors"
                      onClick={() => handlePlayerClick(player.name)}
                    >
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium hover:text-blue-700">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Red */}
              <div className="bg-red-100 p-6 rounded-lg">
                <h4 className="font-bold text-red-800 mb-4 text-lg">TEAM RED</h4>
                <div className="space-y-3">
                  {teamData.teamRed.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-red-200 p-2 rounded transition-colors"
                      onClick={() => handlePlayerClick(player.name)}
                    >
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        {player.isCurrentUser ? (
                          <MessageCircle className="h-4 w-4 text-white" />
                        ) : (
                          <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                        )}
                      </div>
                      <span
                        className={`font-medium hover:text-red-700 ${player.isCurrentUser ? "text-green-600" : ""}`}
                      >
                        {player.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleChatHost}
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
              >
                <Phone className="h-4 w-4" />
                Chat Host
              </Button>
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
