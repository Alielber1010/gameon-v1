"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getSportsForDisplay } from "@/lib/constants/sports"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SportFiltersProps {
  selectedSports: string[]
  onSportsChange: (sports: string[]) => void
}

export function SportFilters({ selectedSports, onSportsChange }: SportFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const sports = getSportsForDisplay()
  
  // Show first 8 sports by default, rest when expanded
  const displayedSports = isExpanded ? sports : sports.slice(0, 8)

  const handleSportToggle = (sport: string) => {
    if (selectedSports.includes(sport)) {
      onSportsChange(selectedSports.filter((s) => s !== sport))
    } else {
      onSportsChange([...selectedSports, sport])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-6">
        {displayedSports.map((sport) => (
          <div key={sport.value} className="flex items-center space-x-2">
            <Checkbox
              id={sport.value}
              checked={selectedSports.includes(sport.value)}
              onCheckedChange={() => handleSportToggle(sport.value)}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 w-5 h-5"
            />
            <Label
              htmlFor={sport.value}
              className="text-base font-semibold cursor-pointer text-gray-800 hover:text-green-600 transition-colors"
            >
              {sport.label}
            </Label>
          </div>
        ))}
      </div>
      {sports.length > 8 && (
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show More ({sports.length - 8} more sports)
            </>
          )}
        </Button>
      )}
    </div>
  )
}
