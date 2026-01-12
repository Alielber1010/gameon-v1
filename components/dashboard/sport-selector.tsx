"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { getSportsForDisplay, getSportDisplayName } from "@/lib/constants/sports"
import { Search, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SportSelectorProps {
  value: string
  onChange: (sport: string) => void
  label?: string
}

// Categorize sports for easier navigation
const SPORT_CATEGORIES = {
  'Traditional Sports': ['football', 'basketball', 'soccer', 'tennis', 'volleyball', 'badminton', 'table-tennis', 'cricket', 'baseball', 'softball', 'rugby', 'hockey', 'ice-hockey', 'swimming', 'running', 'cycling', 'golf'],
  'Asian Sports': ['sepak-takraw', 'kabaddi', 'kho-kho', 'gilli-danda', 'carrom', 'chess', 'mahjong', 'go', 'xiangqi'],
  'Martial Arts': ['karate', 'taekwondo', 'judo', 'kung-fu', 'muay-thai', 'boxing', 'wrestling', 'jiu-jitsu', 'aikido', 'capoeira'],
  'Dances': ['dancing', 'zumba', 'aerobic-dance', 'hip-hop-dance', 'salsa', 'bhangra', 'bollywood-dance', 'k-pop-dance', 'ballroom-dancing', 'latin-dance'],
  'Yoga & Wellness': ['yoga', 'pilates', 'meditation', 'tai-chi', 'qigong', 'stretching', 'calisthenics'],
  'Fitness & Training': ['gym', 'weightlifting', 'crossfit', 'functional-training', 'cardio', 'hiit', 'bodybuilding'],
  'Outdoor Activities': ['hiking', 'trekking', 'rock-climbing', 'mountaineering', 'camping', 'kayaking', 'canoeing', 'surfing', 'skateboarding', 'rollerblading'],
  'Other Activities': ['archery', 'shooting', 'fishing', 'darts', 'billiards', 'snooker', 'bowling', 'skating', 'ice-skating', 'skiing', 'snowboarding'],
}

export function SportSelector({ value, onChange, label = "Sport/Activity *" }: SportSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const allSports = getSportsForDisplay()

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter sports based on search and category
  const filteredSports = useMemo(() => {
    let sports = allSports

    // Filter by category
    if (selectedCategory) {
      const categorySports = SPORT_CATEGORIES[selectedCategory as keyof typeof SPORT_CATEGORIES] || []
      sports = sports.filter(s => categorySports.includes(s.value))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      sports = sports.filter(s => 
        s.label.toLowerCase().includes(query) || 
        s.value.toLowerCase().includes(query)
      )
    }

    return sports
  }, [allSports, selectedCategory, searchQuery])

  const categories = Object.keys(SPORT_CATEGORIES)

  return (
    <div ref={containerRef} className="space-y-2 relative w-full">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 text-left border-2 rounded-md bg-white",
          "hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500",
          isOpen && "border-green-600",
          !value && "text-gray-500"
        )}
      >
        <span className={cn("flex items-center gap-2", value ? "text-gray-900" : "text-gray-500")}>
          {value ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              {getSportDisplayName(value)}
            </>
          ) : (
            "Select sport or activity"
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "transform rotate-180")} />
      </button>

      {/* Expandable Content - Full width matching form container */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border-2 border-green-200 rounded-lg shadow-lg p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sports or activities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedCategory(null) // Clear category when searching
              }}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Category Filters - Pill shaped buttons */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 text-sm rounded-full border-2 transition-colors",
                  selectedCategory === null
                    ? "bg-white border-green-600 text-green-700 font-medium"
                    : "bg-white border-green-300 text-gray-700 hover:border-green-500 hover:text-green-600"
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-full border-2 transition-colors",
                    selectedCategory === category
                      ? "bg-white border-green-600 text-green-700 font-medium"
                      : "bg-white border-green-300 text-gray-700 hover:border-green-500 hover:text-green-600"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Separator Line */}
          <div className="border-t border-green-200"></div>

          {/* Sports List - Simple text items in rows */}
          <div>
            {filteredSports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sports found. Try a different search.
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {filteredSports.map((sport) => (
                  <button
                    key={sport.value}
                    type="button"
                    onClick={() => {
                      onChange(sport.value)
                      setIsOpen(false) // Close after selection
                    }}
                    className={cn(
                      "text-sm transition-colors relative",
                      value === sport.value
                        ? "text-green-600 font-semibold"
                        : "text-gray-700 hover:text-green-600"
                    )}
                  >
                    {value === sport.value && (
                      <Check className="inline h-4 w-4 mr-1 text-green-600" />
                    )}
                    {sport.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

