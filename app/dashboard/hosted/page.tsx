"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Calendar, Clock, Edit, Trash2 } from "lucide-react"
import { HostedGameManagementModal } from "@/components/dashboard/hosted-game-management-modal"
import { UserProfileModal } from "@/components/dashboard/user-profile-modal"
import type { Game, JoinRequest, Player, UserProfile } from "@/types/game"

export default function HostedGamesPage() {
  const [hostedGames, setHostedGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    // Load hosted games from localStorage - Replace with API call
    const games = JSON.parse(localStorage.getItem("hostedGames") || "[]")

    // Add mock join requests and players to games for demonstration
    const gamesWithData = games.map((game: Game) => ({
      ...game,
      joinRequests: [
        {
          id: "req1",
          userId: "user1",
          userName: "NOUR",
          userAge: 22,
          userSkillLevel: "Intermediate",
          userImage: "/placeholder.svg?height=40&width=40",
          userWhatsApp: "https://wa.me/1234567890",
          requestDate: "2024-01-15",
        },
        {
          id: "req2",
          userId: "user2",
          userName: "AHMED",
          userAge: 25,
          userSkillLevel: "Professional",
          userImage: "/placeholder.svg?height=40&width=40",
          userWhatsApp: "https://wa.me/1234567891",
          requestDate: "2024-01-15",
        },
      ],
      teamBlue: [
        {
          id: "player1",
          name: "KHALED",
          isCurrentUser: false,
          age: 28,
          skillLevel: "Intermediate",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567892",
        },
        {
          id: "player2",
          name: "MOHAMED",
          isCurrentUser: false,
          age: 24,
          skillLevel: "Beginner",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567893",
        },
        {
          id: "player3",
          name: "YOUSSEF",
          isCurrentUser: false,
          age: 30,
          skillLevel: "Advanced",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567894",
        },
      ],
      teamRed: [
        {
          id: "player4",
          name: "NOUR",
          isCurrentUser: false,
          age: 26,
          skillLevel: "Intermediate",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567895",
        },
        {
          id: "player5",
          name: "AHMED",
          isCurrentUser: false,
          age: 23,
          skillLevel: "Professional",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567896",
        },
      ],
    }))

    setHostedGames(gamesWithData)
  }, [])

  const handleDeleteGame = (gameId: string) => {
    // TODO: Replace with API call
    const updatedGames = hostedGames.filter((game) => game.id !== gameId)
    setHostedGames(updatedGames)
    localStorage.setItem("hostedGames", JSON.stringify(updatedGames))
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

  const handleAcceptRequest = (gameId: string, requestId: string) => {
    // TODO: Replace with API call
    setHostedGames((prev) =>
      prev.map((game) => {
        if (game.id === gameId) {
          const request = game.joinRequests?.find((req) => req.id === requestId)
          if (request) {
            const newPlayer: Player = {
              id: request.userId,
              name: request.userName,
              isCurrentUser: false,
              age: request.userAge,
              skillLevel: request.userSkillLevel,
              image: request.userImage,
              whatsApp: request.userWhatsApp,
            }

            return {
              ...game,
              joinRequests: game.joinRequests?.filter((req) => req.id !== requestId) || [],
              teamRed: [...(game.teamRed || []), newPlayer],
              seatsLeft: game.seatsLeft - 1,
            }
          }
        }
        return game
      }),
    )
  }

  const handleRejectRequest = (gameId: string, requestId: string) => {
    // TODO: Replace with API call
    setHostedGames((prev) =>
      prev.map((game) => {
        if (game.id === gameId) {
          return {
            ...game,
            joinRequests: game.joinRequests?.filter((req) => req.id !== requestId) || [],
          }
        }
        return game
      }),
    )
  }

  const handleRemovePlayer = (gameId: string, playerId: string, team: "blue" | "red") => {
    // TODO: Replace with API call
    setHostedGames((prev) =>
      prev.map((game) => {
        if (game.id === gameId) {
          const updatedGame = { ...game }
          if (team === "blue") {
            updatedGame.teamBlue = game.teamBlue?.filter((player) => player.id !== playerId) || []
          } else {
            updatedGame.teamRed = game.teamRed?.filter((player) => player.id !== playerId) || []
          }
          updatedGame.seatsLeft = game.seatsLeft + 1
          return updatedGame
        }
        return game
      }),
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold text-green-600">Hosted Games</h1>
      </div>

      {hostedGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostedGames.map((game) => (
            <Card key={game.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative cursor-pointer" onClick={() => handleGameClick(game)}>
                <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {game.sport}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg cursor-pointer" onClick={() => handleGameClick(game)}>
                    {game.title}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    Host
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{game.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{game.location}</span>
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

                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGame(game.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-12 w-12 text-green-600" />
          </div>
          <p className="text-gray-500 text-lg mb-2">No hosted games yet</p>
          <p className="text-gray-400">Create your first game to start building your sports community!</p>
        </div>
      )}

      {/* Hosted Game Management Modal */}
      {selectedGame && (
        <HostedGameManagementModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          onUserClick={handleUserClick}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onRemovePlayer={handleRemovePlayer}
        />
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}
