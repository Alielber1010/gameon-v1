"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Loader2 } from "lucide-react"
import { reverseGeocode, searchLocations, type LocationSuggestion } from "@/lib/utils/geocoding"
import { useDialog } from "@/lib/utils/dialog"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  location: string
  onLocationChange: (location: string) => void
  onCityChange?: (city: string) => void
  onLocationSelect?: (suggestion: LocationSuggestion | null) => void
}

export function SearchBar({ searchQuery, onSearchChange, location, onLocationChange, onCityChange, onLocationSelect }: SearchBarProps) {
  const { alert } = useDialog()
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const locationInputRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      await alert("Geolocation is not supported by your browser.", "Location Unavailable")
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const result = await reverseGeocode(latitude, longitude)

          if (result) {
            const cityName = result.city || result.formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            onLocationChange(cityName)
            if (onCityChange) onCityChange(cityName)
            if (onLocationSelect) {
              onLocationSelect({
                displayName: result.formattedAddress || cityName,
                address: result.formattedAddress || cityName,
                city: result.city,
                state: result.state,
                country: result.country,
                coordinates: { lat: latitude, lng: longitude },
              })
            }
          } else {
            const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            onLocationChange(fallback)
          }
        } catch {
          const { latitude, longitude } = position.coords
          onLocationChange(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } finally {
          setIsGettingLocation(false)
        }
      },
      async (error) => {
        let errorMessage = "Unable to get your location."
        if (error.code === error.PERMISSION_DENIED)
          errorMessage = "Location access denied. Please enable location permissions in your browser settings."
        else if (error.code === error.POSITION_UNAVAILABLE)
          errorMessage = "Location information is unavailable."
        else if (error.code === error.TIMEOUT)
          errorMessage = "Location request timed out. Please try again."
        await alert(errorMessage, "Location Error")
        setIsGettingLocation(false)
      }
    )
  }

  const handleLocationInputChange = (value: string) => {
    onLocationChange(value)
    setShowLocationSuggestions(true)

    // Clear everything when input is cleared
    if (!value.trim()) {
      if (onCityChange) onCityChange("")
      if (onLocationSelect) onLocationSelect(null)
      setLocationSuggestions([])
      return
    }

    // While typing, filter by city name immediately (before suggestions load)
    const typedCity = value.split(',')[0]?.trim() || ""
    if (typedCity && onCityChange) onCityChange(typedCity)
    // Clear coordinate-based filter while user is still typing
    if (onLocationSelect) onLocationSelect(null)

    if (value.length < 2) {
      setLocationSuggestions([])
      return
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingLocation(true)
      try {
        const suggestions = await searchLocations(value, 6)
        setLocationSuggestions(suggestions)
        if (suggestions.length > 0) setShowLocationSuggestions(true)
      } catch {
        setLocationSuggestions([])
      } finally {
        setIsSearchingLocation(false)
      }
    }, 300)
  }

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    // Show just the city (and state if available) in the input
    const cityName = suggestion.city || suggestion.displayName.split(',')[0]?.trim()
    const displayText = suggestion.state && cityName !== suggestion.state
      ? `${cityName}, ${suggestion.state}`
      : cityName || suggestion.displayName.split(',')[0]?.trim()

    onLocationChange(displayText || "")

    if (onCityChange) onCityChange(cityName || "")
    if (onLocationSelect) onLocationSelect(suggestion)

    setShowLocationSuggestions(false)
    setLocationSuggestions([])
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false)
      }
    }
    if (showLocationSuggestions) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLocationSuggestions])

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="relative flex-1">
        <Input
          placeholder="SEARCH GAMES ..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 sm:h-12 text-base sm:text-lg bg-gray-200 border-0 rounded-full placeholder:text-gray-500 text-gray-800 font-medium"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
      </div>

      <div className="flex items-center gap-2 bg-gray-200 rounded-full px-3 sm:px-4 py-2 min-w-fit relative" ref={locationInputRef}>
        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
        <div className="relative flex-1 min-w-0">
          <Input
            value={location}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            onFocus={() => {
              if (location.length >= 2 && locationSuggestions.length > 0) setShowLocationSuggestions(true)
            }}
            className="border-0 bg-transparent text-gray-800 font-medium text-sm sm:text-base min-w-0"
            placeholder="Everywhere"
          />
          {isSearchingLocation && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute z-50 w-64 sm:w-80 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-auto top-full left-0">
              {locationSuggestions.map((suggestion, index) => {
                const cityLabel = suggestion.city || suggestion.displayName.split(',')[0]?.trim()
                const stateLabel = suggestion.state || ""
                const countryLabel = suggestion.country || ""
                const subtitle = [stateLabel, countryLabel].filter(Boolean).join(", ")
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleLocationSelect(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-0 min-h-[44px] touch-manipulation"
                  >
                    <div className="font-medium text-gray-900 text-sm">{cityLabel}</div>
                    {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-700 font-medium hover:bg-gray-300 min-h-[44px] px-3 sm:px-4 flex-shrink-0"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="text-xs sm:text-sm">Location</span>
          )}
        </Button>
      </div>
    </div>
  )
}
