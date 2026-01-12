"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { useDialog } from "@/lib/utils/dialog"

interface TimePickerProps {
  startTime: string // Format: "HH:MM"
  endTime: string // Format: "HH:MM"
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  label?: string
  disabled?: boolean
}

export function TimePicker({ startTime, endTime, onStartTimeChange, onEndTimeChange, label, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selecting, setSelecting] = useState<"start" | "end">("start")
  const [mode, setMode] = useState<"hour" | "minute">("hour")
  const [selectedHour, setSelectedHour] = useState(12)
  const [selectedHour24, setSelectedHour24] = useState(12) // 24-hour format
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [isAM, setIsAM] = useState(true)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Parse initial start time
  useEffect(() => {
    if (selecting === "start" && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      setSelectedHour24(hours)
      setSelectedHour(hours % 12 || 12)
      setIsAM(hours < 12)
      setSelectedMinute(Math.floor(minutes / 5) * 5) // Round to nearest 5 minutes
    } else if (selecting === "end" && endTime) {
      const [hours, minutes] = endTime.split(':').map(Number)
      setSelectedHour24(hours)
      setSelectedHour(hours % 12 || 12)
      setIsAM(hours < 12)
      setSelectedMinute(Math.floor(minutes / 5) * 5) // Round to nearest 5 minutes
    }
  }, [startTime, endTime, selecting])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setMode("hour")
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour)
    // Convert 12-hour to 24-hour format
    let hour24 = hour
    if (hour === 12) {
      hour24 = isAM ? 0 : 12
    } else {
      hour24 = isAM ? hour : hour + 12
    }
    setSelectedHour24(hour24)
    setMode("minute")
    
    // Auto-update the time immediately when hour is selected (if minute is already selected)
    if (selectedMinute !== null && selectedMinute !== undefined) {
      const timeString = `${String(hour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
      if (selecting === "start") {
        onStartTimeChange(timeString)
      } else {
        onEndTimeChange(timeString)
      }
    }
  }

  const handleMinuteClick = async (minute: number) => {
    setSelectedMinute(minute)
    // Auto-update the time immediately when minute is selected
    const timeString = `${String(selectedHour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    
    if (selecting === "start") {
      // Validate and set start time
      onStartTimeChange(timeString)
    } else {
      // Setting end time - check it's after start time
      if (startTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number)
        const [endHours, endMinutes] = timeString.split(':').map(Number)
        const startTotal = startHours * 60 + startMinutes
        const endTotal = endHours * 60 + endMinutes
        
        if (endTotal <= startTotal) {
          // End time must be after start time
          await alert("End time must be after start time", "Invalid Time")
          return
        }
        
        const durationHours = (endTotal - startTotal) / 60
        if (durationHours < 1) {
          // Duration must be at least 1 hour
          await alert("Duration must be at least 1 hour", "Invalid Duration")
          return
        }
        if (durationHours > 6) {
          // Duration cannot exceed 6 hours
          await alert("Duration cannot exceed 6 hours", "Invalid Duration")
          return
        }
      }
      
      onEndTimeChange(timeString)
    }
  }


  const handleStartEndClick = (type: "start" | "end") => {
    setSelecting(type)
    setMode("hour")
    
    // Load the time for the selected type
    const timeToLoad = type === "start" ? startTime : endTime
    if (timeToLoad) {
      const [hours, minutes] = timeToLoad.split(':').map(Number)
      setSelectedHour24(hours)
      setSelectedHour(hours % 12 || 12)
      setIsAM(hours < 12)
      setSelectedMinute(Math.floor(minutes / 5) * 5)
    } else if (type === "end" && startTime) {
      // If end time not set but start time is, default to 1 hour after start
      const [hours, mins] = startTime.split(':').map(Number)
      const endTotal = hours * 60 + mins + 60
      const endHours = Math.floor(endTotal / 60) % 24
      const endMins = endTotal % 60
      setSelectedHour24(endHours)
      setSelectedHour(endHours % 12 || 12)
      setIsAM(endHours < 12)
      setSelectedMinute(Math.floor(endMins / 5) * 5)
    }
  }

  const toggleAMPM = () => {
    const newIsAM = !isAM
    setIsAM(newIsAM)
    
    // Update 24-hour format
    let hour24 = selectedHour
    if (selectedHour === 12) {
      hour24 = newIsAM ? 0 : 12
    } else {
      hour24 = newIsAM ? selectedHour : selectedHour + 12
    }
    setSelectedHour24(hour24)
    
    // Auto-update the time immediately when AM/PM is toggled (if minute is already selected)
    if (selectedMinute !== null && selectedMinute !== undefined) {
      const timeString = `${String(hour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
      if (selecting === "start") {
        onStartTimeChange(timeString)
      } else {
        onEndTimeChange(timeString)
      }
    }
  }

  const formatDisplayTime = (time: string) => {
    if (!time) return "Not set"
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  }

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true)
      setSelecting("start")
      setMode("hour")
      // Initialize with start time if available
      if (startTime) {
        const [hours, minutes] = startTime.split(':').map(Number)
        setSelectedHour24(hours)
        setSelectedHour(hours % 12 || 12)
        setIsAM(hours < 12)
        setSelectedMinute(Math.floor(minutes / 5) * 5)
      }
    }
  }

  // Generate hour positions (1-12 on clock face)
  const hourPositions = Array.from({ length: 12 }, (_, i) => i + 1)
  
  // Generate minute positions (0, 5, 10, 15, ..., 55)
  const minutePositions = Array.from({ length: 12 }, (_, i) => i * 5)

  // Calculate position on clock face (radius = 80px, center at 100, 100)
  const getPosition = (index: number, total: number, radius: number = 80) => {
    const angle = (index * 360 / total - 90) * (Math.PI / 180)
    const x = 100 + radius * Math.cos(angle)
    const y = 100 + radius * Math.sin(angle)
    return { x, y }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 border border-input bg-background rounded-md text-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-green-500"
        )}
      >
        <Clock className="h-4 w-4" />
        <span className="flex-1 text-left">
          {startTime && endTime 
            ? `${formatDisplayTime(startTime)} - ${formatDisplayTime(endTime)}`
            : "Select start and end time"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
          {/* Selection Mode Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <button
                type="button"
                onClick={() => handleStartEndClick("start")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  selecting === "start"
                    ? "bg-green-600 text-white ring-2 ring-green-300"
                    : startTime
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                Start: {(() => {
                  // If selecting start time, show the currently selected time (even if not set yet)
                  if (selecting === "start") {
                    const currentTime = `${String(selectedHour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
                    return formatDisplayTime(currentTime)
                  }
                  // Otherwise show the set time or "Not set"
                  return startTime ? formatDisplayTime(startTime) : "Not set"
                })()}
              </button>
              <div className="text-gray-400">→</div>
              <button
                type="button"
                onClick={() => handleStartEndClick("end")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  selecting === "end"
                    ? "bg-blue-600 text-white ring-2 ring-blue-300"
                    : endTime
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                End: {(() => {
                  // If selecting end time, show the currently selected time (even if not set yet)
                  if (selecting === "end") {
                    const currentTime = `${String(selectedHour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
                    return formatDisplayTime(currentTime)
                  }
                  // Otherwise show the set time or "Not set"
                  return endTime ? formatDisplayTime(endTime) : "Not set"
                })()}
              </button>
            </div>
            
            {/* Mode Toggle and AM/PM */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("hour")}
                className={cn(
                  "flex-1 px-3 py-1 rounded text-sm font-medium transition-colors",
                  mode === "hour"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Hour
              </button>
              <button
                type="button"
                onClick={() => setMode("minute")}
                className={cn(
                  "flex-1 px-3 py-1 rounded text-sm font-medium transition-colors",
                  mode === "minute"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Minute
              </button>
              {mode === "hour" && (
                <button
                  type="button"
                  onClick={toggleAMPM}
                  className={cn(
                    "px-3 py-1 rounded text-sm font-medium transition-colors",
                    isAM
                      ? "bg-blue-600 text-white"
                      : "bg-orange-600 text-white"
                  )}
                >
                  {isAM ? "AM" : "PM"}
                </button>
              )}
            </div>
          </div>

          {/* Clock Face */}
          <div className="relative w-48 h-48 mx-auto">
            <svg width="200" height="200" className="w-full h-full">
              {/* Clock circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              
              {/* Center dot */}
              <circle
                cx="100"
                cy="100"
                r="4"
                fill="#6b7280"
              />

              {mode === "hour" ? (
                // Hour markers
                <>
                  {hourPositions.map((hour) => {
                    const { x, y } = getPosition(hour - 1, 12, 70)
                    const isSelected = selectedHour === hour
                    return (
                      <g key={hour}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 18 : 12}
                          fill={isSelected ? "#16a34a" : "#f3f4f6"}
                          stroke={isSelected ? "#15803d" : "#d1d5db"}
                          strokeWidth={isSelected ? 2 : 1}
                          className="cursor-pointer hover:opacity-80 transition-all"
                          onClick={() => handleHourClick(hour)}
                        />
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight={isSelected ? "bold" : "normal"}
                          fill={isSelected ? "white" : "#374151"}
                          className="pointer-events-none select-none"
                        >
                          {hour}
                        </text>
                      </g>
                    )
                  })}
                </>
              ) : (
                // Minute markers
                <>
                  {minutePositions.map((minute) => {
                    const { x, y } = getPosition(minute / 5, 12, 70)
                    const isSelected = selectedMinute === minute
                    return (
                      <g key={minute}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 18 : 12}
                          fill={isSelected ? "#16a34a" : "#f3f4f6"}
                          stroke={isSelected ? "#15803d" : "#d1d5db"}
                          strokeWidth={isSelected ? 2 : 1}
                          className="cursor-pointer hover:opacity-80 transition-all"
                          onClick={() => handleMinuteClick(minute)}
                        />
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight={isSelected ? "bold" : "normal"}
                          fill={isSelected ? "white" : "#374151"}
                          className="pointer-events-none select-none"
                        >
                          {minute}
                        </text>
                      </g>
                    )
                  })}
                </>
              )}

              {/* Hand pointing to selected time */}
              {mode === "minute" && (
                <line
                  x1="100"
                  y1="100"
                  x2={getPosition(selectedMinute / 5, 12, 60).x}
                  y2={getPosition(selectedMinute / 5, 12, 60).y}
                  stroke="#16a34a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
              {mode === "hour" && (
                <line
                  x1="100"
                  y1="100"
                  x2={getPosition(selectedHour - 1, 12, 50).x}
                  y2={getPosition(selectedHour - 1, 12, 50).y}
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>

          {/* Selected Time Display */}
          <div className="mt-4 text-center space-y-2">
            <div>
              <p className="text-sm text-gray-600">
                {selecting === "start" ? "Selecting Start Time" : "Selecting End Time"}
              </p>
              <p className="text-lg font-bold text-green-600">
                {`${String(selectedHour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDisplayTime(`${String(selectedHour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`)}
              </p>
            </div>
            
            {/* Navigation/Confirm Button */}
            <button
              type="button"
              onClick={() => {
                // If selecting end time and it's set, close the picker
                if (selecting === "end" && endTime) {
                  setIsOpen(false)
                  setMode("hour")
                  setSelecting("start")
                } else if (selecting === "start" && startTime) {
                  // Switch to end time selection
                  setSelecting("end")
                  setMode("hour")
                  // Set initial end time to 1 hour after start time if end time not set
                  if (!endTime) {
                    const [hours, mins] = startTime.split(':').map(Number)
                    const endTotal = hours * 60 + mins + 60
                    const endHours = Math.floor(endTotal / 60) % 24
                    const endMins = endTotal % 60
                    const defaultEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`
                    onEndTimeChange(defaultEndTime)
                    
                    // Initialize end time selection with default
                    const [defaultHours, defaultMinutes] = defaultEndTime.split(':').map(Number)
                    setSelectedHour24(defaultHours)
                    setSelectedHour(defaultHours % 12 || 12)
                    setIsAM(defaultHours < 12)
                    setSelectedMinute(Math.floor(defaultMinutes / 5) * 5)
                  } else {
                    // Load existing end time
                    const [hours, minutes] = endTime.split(':').map(Number)
                    setSelectedHour24(hours)
                    setSelectedHour(hours % 12 || 12)
                    setIsAM(hours < 12)
                    setSelectedMinute(Math.floor(minutes / 5) * 5)
                  }
                }
              }}
              disabled={
                (selecting === "start" && !startTime) ||
                (selecting === "end" && !endTime)
              }
              className={cn(
                "w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                (selecting === "start" && !startTime) || (selecting === "end" && !endTime)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : selecting === "start"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {selecting === "start" 
                ? (startTime ? "Continue to End Time →" : "Select Hour and Minute First")
                : (endTime ? "Done" : "Select Hour and Minute First")
              }
            </button>
            
            {/* Duration Display (when both times are set) */}
            {startTime && endTime && (() => {
              const [startHours, startMinutes] = startTime.split(':').map(Number)
              const [endHours, endMinutes] = endTime.split(':').map(Number)
              const startTotal = startHours * 60 + startMinutes
              const endTotal = endHours * 60 + endMinutes
              const durationHours = (endTotal - startTotal) / 60
              
              return (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className={cn(
                    "text-sm font-semibold",
                    durationHours >= 1 && durationHours <= 6
                      ? "text-green-600"
                      : "text-red-500"
                  )}>
                    {durationHours.toFixed(1)} hours
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

