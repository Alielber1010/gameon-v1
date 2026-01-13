"use client"

import { useState, useMemo } from "react"
import { SearchBar } from "@/components/dashboard/search-bar"
import { FilterModal } from "@/components/dashboard/filter-modal"
import { GameGrid } from "@/components/dashboard/game-grid"
import { getTimeOfDay } from "@/components/dashboard/timing-filters"
import { GameDetailsModal } from "@/components/dashboard/game-details-modal"
import { ReportModal } from "@/components/dashboard/report-modal"
import { CreateGameModal } from "@/components/dashboard/create-game-modal"
import { HomepageStats } from "@/components/dashboard/homepage-stats"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, Loader2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Game } from "@lib/db/models/types/game"
import { useSession } from "next-auth/react"
import { useGames } from "@/hooks/use-games"

// Transform API game data to frontend Game type
function transformApiGameToGame(apiGame: any): Game {
  const dateObj = new Date(apiGame.date);
  const formattedDate = dateObj.toISOString().split('T')[0];
  const isToday = dateObj.toDateString() === new Date().toDateString();
  
  return {
    id: apiGame.id,
    hostId: apiGame.hostId,
    hostName: apiGame.hostName,
    hostImage: apiGame.hostImage,
    title: apiGame.title,
    sport: apiGame.sport,
    image: apiGame.image || '/placeholder.svg?height=200&width=300',
    location: typeof apiGame.location === 'string' 
      ? apiGame.location 
      : (apiGame.location?.address || apiGame.location?.city || apiGame.location?.country || 'Location not specified'),
    skillLevel: apiGame.skillLevel || 'all',
    seatsLeft: apiGame.seatsLeft || 0,
    date: isToday ? 'Today' : formattedDate,
    time: apiGame.startTime || '',
    endTime: apiGame.endTime || '',
    description: apiGame.description || '',
    hostWhatsApp: apiGame.hostWhatsApp || '',
    teamMembers: apiGame.registeredPlayers?.length || 0,
    minSkillLevel: apiGame.minSkillLevel || apiGame.skillLevel || 'all',
    maxPlayers: apiGame.maxPlayers,
    joinRequests: apiGame.joinRequests || [],
    registeredPlayers: apiGame.registeredPlayers || [],
    hostId: apiGame.hostId,
    hostName: apiGame.hostName,
    hostImage: apiGame.hostImage,
    hostWhatsApp: apiGame.hostWhatsApp || '',
    status: apiGame.status || 'upcoming',
    startTime: apiGame.startTime || '',
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [reportGame, setReportGame] = useState<Game | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [selectedSkillLevels, setSelectedSkillLevels] = useState<string[]>([])
  const [selectedTimings, setSelectedTimings] = useState<string[]>([])
  const [location, setLocation] = useState("") // Default: "Everywhere" (empty = no filter)
  const [city, setCity] = useState<string>("") // Extracted city for API filtering
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Extract city from location string (format: "City, Country" or just "City")
  const extractCityFromLocation = (locationStr: string): string => {
    if (!locationStr || !locationStr.trim()) return ""
    // Try to extract city (first part before comma, or the whole string if no comma)
    const parts = locationStr.split(',')
    return parts[0]?.trim() || ""
  }

  // Handle location change and extract city
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation)
    const extractedCity = extractCityFromLocation(newLocation)
    setCity(extractedCity)
  }

  // Handle city change (from search bar autocomplete)
  const handleCityChange = (newCity: string) => {
    setCity(newCity)
  }

  // Fetch games from API with city filter
  const { games: apiGames, loading, error, refetch } = useGames({
    status: 'upcoming', // Only show upcoming games by default
    limit: 50, // Get more games for filtering
    city: city || undefined, // Only filter by city if city is set
  });

  // Transform API games to frontend format
  const games = useMemo(() => {
    if (!apiGames || apiGames.length === 0) return [];
    return apiGames.map(transformApiGameToGame);
  }, [apiGames]);

  // Filter games based on search and all filters
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Safely get location string for search
      const locationString = typeof game.location === 'string' 
        ? game.location 
        : (game.location?.address || game.location?.city || game.location?.country || '')
      
      // Text search filter
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locationString.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Sport filter
      const matchesSport = selectedSports.length === 0 || selectedSports.includes(game.sport)
      
      // Skill level filter
      // Normalize skill levels for comparison (database uses lowercase, filter uses capitalized)
      const normalizeSkillLevel = (level: string) => {
        if (!level) return ''
        const lower = level.toLowerCase()
        // Map "Professional" to "advanced" (as done in game creation)
        if (lower === 'professional') return 'advanced'
        return lower
      }
      
      const gameSkillLevel = normalizeSkillLevel(game.skillLevel)
      const gameMinSkillLevel = normalizeSkillLevel(game.minSkillLevel || '')
      
      const matchesSkillLevel = selectedSkillLevels.length === 0 || 
        selectedSkillLevels.some(selected => {
          const normalizedSelected = normalizeSkillLevel(selected)
          // Match if game skill level matches selected filter
          // Or if game allows "all" levels (should match any filter)
          // Or if game's minSkillLevel matches
          return normalizedSelected === gameSkillLevel || 
                 normalizedSelected === gameMinSkillLevel ||
                 gameSkillLevel === 'all'
        })
      
      // Timing filter
      const matchesTiming = selectedTimings.length === 0 || 
        (game.startTime && getTimeOfDay(game.startTime) && selectedTimings.includes(getTimeOfDay(game.startTime)!))
      
      return matchesSearch && matchesSport && matchesSkillLevel && matchesTiming
    });
  }, [games, searchQuery, selectedSports, selectedSkillLevels, selectedTimings])

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold">Find Your Game</h1>
      </div>

      <HomepageStats />

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            location={location}
            onLocationChange={handleLocationChange}
            onCityChange={handleCityChange}
          />
        </div>
        <Button
          onClick={() => setShowFilterModal(true)}
          variant="outline"
          className="flex items-center gap-2 h-12 px-6 border-2 border-green-600 text-green-600 hover:bg-green-50"
        >
          <Filter className="h-5 w-5" />
          Filters
          {(selectedSports.length > 0 || selectedSkillLevels.length > 0 || selectedTimings.length > 0) && (
            <span className="ml-1 bg-green-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
              {selectedSports.length + selectedSkillLevels.length + selectedTimings.length}
            </span>
          )}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading games...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading games</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No games found</p>
              <p className="text-gray-500 text-sm mt-2">
                {games.length === 0 
                  ? "Be the first to create a game!" 
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <GameGrid games={filteredGames} onGameClick={setSelectedGame} onReportClick={setReportGame} />
          )}
        </>
      )}

      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          onReport={() => {
            setReportGame(selectedGame)
            setSelectedGame(null)
          }}
          onGameUpdated={() => {
            refetch()
          }}
        />
      )}

      {reportGame && <ReportModal game={reportGame} isOpen={!!reportGame} onClose={() => setReportGame(null)} />}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setSelectedSports(filters.sports)
          setSelectedSkillLevels(filters.skillLevels)
          setSelectedTimings(filters.timings)
        }}
        currentFilters={{
          sports: selectedSports,
          skillLevels: selectedSkillLevels,
          timings: selectedTimings,
        }}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create Game Modal */}
      {showCreateModal && (
        <CreateGameModal 
          isOpen={showCreateModal} 
          onClose={() => {
            setShowCreateModal(false);
          }}
          onSuccess={() => {
            refetch(); // Refresh games list after successful creation
          }}
        />
      )}
    </div>
  )
}