"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Check, ChevronDown, Sun, SunMedium, Moon, Sunset, X } from "lucide-react"
import { getSportsForDisplay, getSportDisplayName } from "@/lib/constants/sports"
import { cn } from "@/lib/utils"
import { getTimeOfDay } from "./timing-filters"

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: {
    sports: string[]
    skillLevels: string[]
    timings: string[]
  }) => void
  currentFilters: {
    sports: string[]
    skillLevels: string[]
    timings: string[]
  }
}

// Categorize sports for easier navigation (same as SportSelector)
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

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Professional"]

const timings = [
  { value: "morning", label: "Morning", icon: Sun, timeRange: "6 AM - 12 PM" },
  { value: "afternoon", label: "Afternoon", icon: SunMedium, timeRange: "12 PM - 5 PM" },
  { value: "evening", label: "Evening", icon: Sunset, timeRange: "5 PM - 9 PM" },
  { value: "night", label: "Night", icon: Moon, timeRange: "9 PM - 6 AM" },
]

export function FilterModal({ isOpen, onClose, onApply, currentFilters }: FilterModalProps) {
  const [selectedSports, setSelectedSports] = useState<string[]>(currentFilters.sports)
  const [selectedSkillLevels, setSelectedSkillLevels] = useState<string[]>(currentFilters.skillLevels)
  const [selectedTimings, setSelectedTimings] = useState<string[]>(currentFilters.timings)
  const [sportSearchQuery, setSportSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSportsExpanded, setIsSportsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const allSports = getSportsForDisplay()

  // Reset to current filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSports(currentFilters.sports)
      setSelectedSkillLevels(currentFilters.skillLevels)
      setSelectedTimings(currentFilters.timings)
    }
  }, [isOpen, currentFilters])

  // Filter sports based on search and category
  const filteredSports = useMemo(() => {
    let sports = allSports

    // Filter by category
    if (selectedCategory) {
      const categorySports = SPORT_CATEGORIES[selectedCategory as keyof typeof SPORT_CATEGORIES] || []
      sports = sports.filter(s => categorySports.includes(s.value))
    }

    // Filter by search query
    if (sportSearchQuery.trim()) {
      const query = sportSearchQuery.toLowerCase()
      sports = sports.filter(s => 
        s.label.toLowerCase().includes(query) || 
        s.value.toLowerCase().includes(query)
      )
    }

    return sports
  }, [allSports, selectedCategory, sportSearchQuery])

  const categories = Object.keys(SPORT_CATEGORIES)
  const displayedSports = isSportsExpanded ? filteredSports : filteredSports.slice(0, 12)

  const handleSportToggle = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport))
    } else {
      setSelectedSports([...selectedSports, sport])
    }
  }

  const handleSkillLevelToggle = (skillLevel: string) => {
    if (selectedSkillLevels.includes(skillLevel)) {
      setSelectedSkillLevels(selectedSkillLevels.filter(s => s !== skillLevel))
    } else {
      setSelectedSkillLevels([...selectedSkillLevels, skillLevel])
    }
  }

  const handleTimingToggle = (timing: string) => {
    if (selectedTimings.includes(timing)) {
      setSelectedTimings(selectedTimings.filter(t => t !== timing))
    } else {
      setSelectedTimings([...selectedTimings, timing])
    }
  }

  const handleApply = () => {
    onApply({
      sports: selectedSports,
      skillLevels: selectedSkillLevels,
      timings: selectedTimings,
    })
    onClose()
  }

  const handleClear = () => {
    setSelectedSports([])
    setSelectedSkillLevels([])
    setSelectedTimings([])
  }

  const hasActiveFilters = selectedSports.length > 0 || selectedSkillLevels.length > 0 || selectedTimings.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-600">Filter Games</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Sports Filter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Sports & Activities</h3>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sports or activities..."
                value={sportSearchQuery}
                onChange={(e) => {
                  setSportSearchQuery(e.target.value)
                  setSelectedCategory(null)
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filters - Pill shaped buttons */}
            {!sportSearchQuery && (
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

            {/* Sports List */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {displayedSports.map((sport) => (
                  <div key={sport.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sport-${sport.value}`}
                      checked={selectedSports.includes(sport.value)}
                      onCheckedChange={() => handleSportToggle(sport.value)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 w-5 h-5"
                    />
                    <Label
                      htmlFor={`sport-${sport.value}`}
                      className="text-sm cursor-pointer text-gray-700 hover:text-green-600 transition-colors"
                    >
                      {sport.label}
                    </Label>
                  </div>
                ))}
              </div>
              {filteredSports.length > 12 && (
                <Button
                  variant="ghost"
                  onClick={() => setIsSportsExpanded(!isSportsExpanded)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 mt-2"
                >
                  {isSportsExpanded ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1 rotate-180" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More ({filteredSports.length - 12} more)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Skill Level Filter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Skill Level</h3>
            <div className="flex flex-wrap gap-6">
              {skillLevels.map((skillLevel) => (
                <div key={skillLevel} className="flex items-center space-x-2">
                  <Checkbox
                    id={`skill-${skillLevel}`}
                    checked={selectedSkillLevels.includes(skillLevel)}
                    onCheckedChange={() => handleSkillLevelToggle(skillLevel)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 w-5 h-5"
                  />
                  <Label
                    htmlFor={`skill-${skillLevel}`}
                    className="text-base font-semibold cursor-pointer text-gray-800 hover:text-green-600 transition-colors"
                  >
                    {skillLevel}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Timing Filter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Timing</h3>
            <div className="flex flex-wrap gap-6">
              {timings.map((timing) => {
                const Icon = timing.icon
                return (
                  <div key={timing.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`timing-${timing.value}`}
                      checked={selectedTimings.includes(timing.value)}
                      onCheckedChange={() => handleTimingToggle(timing.value)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 w-5 h-5"
                    />
                    <Label
                      htmlFor={`timing-${timing.value}`}
                      className="text-base font-semibold cursor-pointer text-gray-800 hover:text-green-600 transition-colors flex items-center gap-2"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{timing.label}</span>
                      <span className="text-sm text-gray-500 font-normal">({timing.timeRange})</span>
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!hasActiveFilters}
              className="text-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}





