"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GamesTable, type Game } from "@/components/admin/games-table"
import { GameDetailsModal } from "@/components/admin/game-details-modal"
import { Gamepad2, Search, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

function AdminGamesContent() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sportFilter, setSportFilter] = useState<string>("all")
  const [availableSports, setAvailableSports] = useState<string[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  // Check for gameId in URL query params (from report modal navigation)
  useEffect(() => {
    const gameIdFromUrl = searchParams.get('gameId')
    if (gameIdFromUrl) {
      setSelectedGameId(gameIdFromUrl)
      // Clean up URL by removing the query parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  useEffect(() => {
    // Check authentication and admin role
    if (sessionStatus === "unauthenticated") {
      router.push("/login")
      return
    }

    if (sessionStatus === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    if (sessionStatus === "authenticated" && session?.user?.role === "admin") {
      fetchGames()
    }
  }, [sessionStatus, session, router])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (searchQuery !== undefined) {
      fetchGames()
    }
  }, [searchQuery, priorityFilter, statusFilter, sportFilter])

  useEffect(() => {
    // Fetch available sports from API
    fetchAvailableSports()
  }, [])

  const fetchAvailableSports = async () => {
    try {
      const response = await fetch('/api/admin/games/sports')
      const data = await response.json()
      if (data.success) {
        setAvailableSports(data.sports || [])
      }
    } catch (error) {
      console.error('Error fetching sports:', error)
    }
  }

  const fetchGames = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      if (priorityFilter && priorityFilter !== "all") {
        params.append("priority", priorityFilter)
      }
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (sportFilter && sportFilter !== "all") {
        params.append("sport", sportFilter)
      }

      const response = await fetch(`/api/admin/games?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setGames(data.games || [])
      } else {
        console.error("Failed to fetch games:", data.error)
      }
    } catch (error) {
      console.error("Error fetching games:", error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking session
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-4 text-gray-600">Loading games...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (sessionStatus === "unauthenticated" || session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Games Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View all games and their report counts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-red-600" />
          <span className="text-sm text-gray-600">{games.length} games</span>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search games by title, sport, or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters Row */}
          <div className="flex items-center gap-3 pt-2 border-t flex-wrap">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority:
            </Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger id="priority" className="w-[200px]">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="green">No Reports (Green)</SelectItem>
                <SelectItem value="yellow">1-5 Reports (Yellow)</SelectItem>
                <SelectItem value="red">5+ Reports (Red)</SelectItem>
              </SelectContent>
            </Select>

            <Label htmlFor="status" className="text-sm font-medium ml-4">
              Status:
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status" className="w-[200px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Label htmlFor="sport" className="text-sm font-medium ml-4">
              Sport:
            </Label>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger id="sport" className="w-[200px]">
                <SelectValue placeholder="All sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {availableSports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1).replace(/-/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Games</CardTitle>
          <CardDescription>
            Click on a game to view details. Priority indicators show report status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GamesTable 
            games={games} 
            onGameClick={(game) => setSelectedGameId(game.id)}
          />
        </CardContent>
      </Card>

      {/* Game Details Modal */}
      <GameDetailsModal
        gameId={selectedGameId}
        isOpen={!!selectedGameId}
        onClose={() => setSelectedGameId(null)}
        onGameDeleted={() => {
          setSelectedGameId(null)
          fetchGames()
        }}
      />
    </div>
  )
}

export default function AdminGamesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-4 text-gray-600">Loading games...</p>
        </div>
      </div>
    }>
      <AdminGamesContent />
    </Suspense>
  )
}
