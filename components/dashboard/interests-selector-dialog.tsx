"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSportsForDisplay, getSportDisplayName } from "@/lib/constants/sports"
import { Search, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface InterestsSelectorDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedInterests: string[]
  onSave: (interests: string[]) => void
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

export function InterestsSelectorDialog({ 
  isOpen, 
  onClose, 
  selectedInterests, 
  onSave 
}: InterestsSelectorDialogProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedInterests)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const allSports = getSportsForDisplay()

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

  const handleToggleInterest = (sportValue: string) => {
    if (tempSelected.includes(sportValue)) {
      // Remove if already selected
      setTempSelected(tempSelected.filter(i => i !== sportValue))
    } else {
      // Add if not at max (5)
      if (tempSelected.length < 5) {
        setTempSelected([...tempSelected, sportValue])
      }
    }
  }

  const handleSave = () => {
    onSave(tempSelected)
    onClose()
  }

  const handleClose = () => {
    setTempSelected(selectedInterests) // Reset to original
    setSearchQuery("")
    setSelectedCategory(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Your Interests</DialogTitle>
          <p className="text-sm text-gray-500">
            Choose up to 5 interests (currently selected: {tempSelected.length}/5)
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Selected Interests Display */}
          {tempSelected.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              {tempSelected.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="bg-green-100 text-green-700 flex items-center gap-1"
                >
                  {getSportDisplayName(interest)}
                  <button
                    type="button"
                    onClick={() => handleToggleInterest(interest)}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

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
                {filteredSports.map((sport) => {
                  const isSelected = tempSelected.includes(sport.value)
                  const isDisabled = !isSelected && tempSelected.length >= 5
                  
                  return (
                    <button
                      key={sport.value}
                      type="button"
                      onClick={() => handleToggleInterest(sport.value)}
                      disabled={isDisabled}
                      className={cn(
                        "text-sm transition-colors relative flex items-center gap-1",
                        isSelected
                          ? "text-green-600 font-semibold"
                          : isDisabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:text-green-600"
                      )}
                    >
                      {isSelected && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      {sport.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Save ({tempSelected.length}/5)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
