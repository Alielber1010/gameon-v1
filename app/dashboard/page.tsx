"use client"

import { useState } from "react"
import { SearchBar } from "@/components/dashboard/search-bar"
import { SportFilters } from "@/components/dashboard/sport-filters"
import { GameGrid } from "@/components/dashboard/game-grid"
import { GameDetailsModal } from "@/components/dashboard/game-details-modal"
import { ReportModal } from "@/components/dashboard/report-modal"
import { CreateGameModal } from "@/components/dashboard/create-game-modal"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus } from "lucide-react"
import type { Game } from "@lib/db/models/types/game"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { signOut } from "next-auth/react";

// Mock data - Replace with API calls
const mockGames: Game[] = [
  {
    id: "1",
    title: "TEAM 3",
    sport: "Football",
    image: "/placeholder.svg?height=200&width=300",
    location: "Austin, JB",
    skillLevel: "Intermediate",
    seatsLeft: 7,
    date: "2024-01-15",
    time: "18:00",
    description: "Friendly football match looking for skilled players",
    hostWhatsApp: "https://wa.me/1234567890",
    teamMembers: 8,
    minSkillLevel: "Intermediate",
  },
  {
    id: "2",
    title: "BASKETBALL",
    sport: "Basketball",
    image: "/placeholder.svg?height=200&width=300",
    location: "Skudai, JB",
    skillLevel: "Beginner",
    seatsLeft: 7,
    date: "2024-01-16",
    time: "19:00",
    description: "Casual basketball game for beginners",
    hostWhatsApp: "https://wa.me/1234567891",
    teamMembers: 6,
    minSkillLevel: "Beginner",
  },
  {
    id: "3",
    title: "BADMINTON DOUBLES",
    sport: "Badminton",
    image: "/placeholder.svg?height=200&width=300",
    location: "Johor Bahru",
    skillLevel: "Advanced",
    seatsLeft: 2,
    date: "2024-01-17",
    time: "20:00",
    description: "Competitive badminton doubles match",
    hostWhatsApp: "https://wa.me/1234567892",
    teamMembers: 4,
    minSkillLevel: "Advanced",
  },
]



export default async function DashboardPage() {
const { data: session, status } = useSession()
  
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [reportGame, setReportGame] = useState<Game | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [location, setLocation] = useState("Skudai, Johor Bahru")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredGames = mockGames.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.sport.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSport = selectedSports.length === 0 || selectedSports.includes(game.sport)
    return matchesSearch && matchesSport
  })

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold">Find Your Game</h1>
      </div>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        location={location}
        onLocationChange={setLocation}
      />

      <SportFilters selectedSports={selectedSports} onSportsChange={setSelectedSports} />

      <GameGrid games={filteredGames} onGameClick={setSelectedGame} onReportClick={setReportGame} />

      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          onReport={() => {
            setReportGame(selectedGame)
            setSelectedGame(null)
          }}
        />
      )}

      {reportGame && <ReportModal game={reportGame} isOpen={!!reportGame} onClose={() => setReportGame(null)} />}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create Game Modal */}
      {showCreateModal && <CreateGameModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}

const handleLogout = () => {
  signOut({ callbackUrl: "/login" });
};