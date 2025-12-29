"use client"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { UpcomingGameDetailsModal } from "@/components/dashboard/upcoming-game-details-modal"
import type { Game } from "@/types/game"

// Mock data for joined games - Replace with API calls
const joinedGames: Game[] = [
  {
    id: "1",
    title: "BASKETBALL",
    sport: "Basketball",
    image: "/placeholder.svg?height=200&width=300",
    location: "Skudai, JB",
    skillLevel: "Beginner",
    seatsLeft: 2,
    date: "Today",
    time: "18:00",
    description: "Friendly basketball match",
    hostWhatsApp: "https://wa.me/1234567890",
    teamMembers: 8,
    minSkillLevel: "Beginner",
  },
  {
    id: "2",
    title: "TEAM 3",
    sport: "Football",
    image: "/placeholder.svg?height=200&width=300",
    location: "Austin, JB",
    skillLevel: "Intermediate",
    seatsLeft: 7,
    date: "In 2 Days",
    time: "19:00",
    description: "Competitive football match",
    hostWhatsApp: "https://wa.me/1234567891",
    teamMembers: 6,
    minSkillLevel: "Intermediate",
  },
]

export default function UpcomingGamesPage() {
  const [games, setGames] = useState(joinedGames)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const handleLeaveGame = (gameId: string) => {
    // TODO: Replace with API call
    setGames(games.filter((game) => game.id !== gameId))
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold text-green-600">Joined Games</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div key={game.id} className="relative cursor-pointer" onClick={() => setSelectedGame(game)}>
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <div className="flex items-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-green-600 rounded-full"></div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-48 object-cover" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{game.title}</h3>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">{game.sport}</span>
                </div>

                <div className="text-sm text-gray-600">📍 {game.location}</div>

                <div className="text-sm">
                  <span className="font-medium">Skill level:</span> {game.skillLevel}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">👥 {game.seatsLeft} seats left</div>
                  <div className="text-sm font-medium">{game.date}</div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLeaveGame(game.id)
                  }}
                >
                  Leave Game
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGame && (
        <UpcomingGameDetailsModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          onLeaveGame={() => {
            handleLeaveGame(selectedGame.id)
            setSelectedGame(null)
          }}
        />
      )}

      {games.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No upcoming games found</p>
          <p className="text-gray-400">Join some games to see them here!</p>
        </div>
      )}
    </div>
  )
}
