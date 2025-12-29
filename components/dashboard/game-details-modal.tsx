"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, MessageCircle, Flag } from "lucide-react"
import { PublicUserProfileModal } from "./public-user-profile-modal"
import { useState } from "react"
import type { Game, UserProfile } from "@/types/game"
import Image from "next/image"

interface GameDetailsModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onReport: () => void
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
  }

  return (
    profiles[playerName] || {
      id: "unknown",
      name: playerName,
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

export function GameDetailsModal({ game, isOpen, onClose, onReport }: GameDetailsModalProps) {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  const handleContactHost = () => {
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
                height={300}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-gray-600">{game.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Skill level:</span>
                    <Badge variant="outline">{game.skillLevel}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Age Range:</span>
                    <span>18-40</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{game.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{game.location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">TEAM BLUE</h4>
                    <div className="space-y-1">
                      {teamData.teamBlue.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-blue-200 p-2 rounded transition-colors group"
                          onClick={() => handlePlayerClick(player.name)}
                          title="Click to view profile"
                        >
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center group-hover:bg-green-700 transition-colors">
                            <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                          </div>
                          <span className="text-sm hover:text-blue-700 font-medium group-hover:underline">
                            {player.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-red-100 p-4 rounded-lg">
                    <h4 className="font-bold text-red-800 mb-2">TEAM RED</h4>
                    <div className="space-y-1">
                      {teamData.teamRed.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-red-200 p-2 rounded transition-colors group"
                          onClick={() => handlePlayerClick(player.name)}
                          title="Click to view profile"
                        >
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center group-hover:bg-green-700 transition-colors">
                            <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                          </div>
                          <span className="text-sm hover:text-red-700 font-medium group-hover:underline">
                            {player.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Location</h4>
                  <div className="flex items-center gap-2 text-red-600">
                    <MapPin className="h-4 w-4" />
                    <span>{game.seatsLeft} seats left</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={onReport} className="flex items-center gap-2 bg-transparent">
                <Flag className="h-4 w-4" />
                REPORT
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleContactHost}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact Owner
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">Join Game</Button>
              </div>
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
