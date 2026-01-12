"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sun, SunMedium, Moon, Sunset } from "lucide-react"

interface TimingFiltersProps {
  selectedTimings: string[]
  onTimingsChange: (timings: string[]) => void
}

const timings = [
  { value: "morning", label: "Morning", icon: Sun, timeRange: "6 AM - 12 PM" },
  { value: "afternoon", label: "Afternoon", icon: SunMedium, timeRange: "12 PM - 5 PM" },
  { value: "evening", label: "Evening", icon: Sunset, timeRange: "5 PM - 9 PM" },
  { value: "night", label: "Night", icon: Moon, timeRange: "9 PM - 6 AM" },
]

export function TimingFilters({ selectedTimings, onTimingsChange }: TimingFiltersProps) {
  const handleTimingToggle = (timing: string) => {
    if (selectedTimings.includes(timing)) {
      onTimingsChange(selectedTimings.filter((t) => t !== timing))
    } else {
      onTimingsChange([...selectedTimings, timing])
    }
  }


  return (
    <div className="flex flex-wrap gap-6">
      {timings.map((timing) => {
        const Icon = timing.icon
        return (
          <div key={timing.value} className="flex items-center space-x-3">
            <Checkbox
              id={timing.value}
              checked={selectedTimings.includes(timing.value)}
              onCheckedChange={() => handleTimingToggle(timing.value)}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 w-5 h-5"
            />
            <Label
              htmlFor={timing.value}
              className="text-lg font-semibold cursor-pointer text-gray-800 hover:text-green-600 transition-colors flex items-center gap-2"
            >
              <Icon className="h-5 w-5" />
              <span>{timing.label}</span>
              <span className="text-sm text-gray-500 font-normal">({timing.timeRange})</span>
            </Label>
          </div>
        )
      })}
    </div>
  )
}

// Export helper function for filtering
export function getTimeOfDay(time: string): string | null {
  if (!time) return null
  
  // Parse time (format: "HH:MM" or "HH:MM AM/PM")
  let hour: number
  
  if (time.includes('AM') || time.includes('PM')) {
    // 12-hour format
    const [timePart, period] = time.split(/\s*(AM|PM)/i)
    const [h, m] = timePart.split(':').map(Number)
    hour = period.toUpperCase() === 'PM' && h !== 12 ? h + 12 : h === 12 && period.toUpperCase() === 'AM' ? 0 : h
  } else {
    // 24-hour format
    const [h] = time.split(':').map(Number)
    hour = h
  }
  
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  if (hour >= 21 || hour < 6) return "night"
  
  return null
}

