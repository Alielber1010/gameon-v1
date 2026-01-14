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
}

export function SearchBar({ searchQuery, onSearchChange, location, onLocationChange, onCityChange }: SearchBarProps) {
  const { alert } = useDialog()
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const locationInputRef = useRef<HTMLDivElement>(null)

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
            // Format: "City, Country" or fallback to formatted address
            const formattedLocation = result.city && result.country
              ? `${result.city}, ${result.country}`
              : result.formattedAddress || result.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            
            onLocationChange(formattedLocation)
            // Extract and notify city change
            if (result.city && onCityChange) {
              onCityChange(result.city)
            }
          } else {
            // Fallback to coordinates if reverse geocoding fails
            onLocationChange(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          }
        } catch (error) {
          console.error("Error reverse geocoding location:", error)
          const { latitude, longitude } = position.coords
          onLocationChange(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } finally {
          setIsGettingLocation(false)
        }
      },
      async (error) => {
        console.error("Error getting location:", error)
        let errorMessage = "Unable to get your location."
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again."
            break
        }
        
        await alert(errorMessage, "Location Error")
        setIsGettingLocation(false)
      }
    )
  }

  // Handle location input with autocomplete
  const handleLocationInputChange = async (value: string) => {
    onLocationChange(value)
    setShowLocationSuggestions(true)

    // Clear city if location is cleared
    if (!value.trim()) {
      if (onCityChange) {
        onCityChange("")
      }
      setLocationSuggestions([])
      return
    }

    // Extract city from typed location (format: "City, Country" or just "City")
    // This allows manual typing to also set the city filter
    const parts = value.split(',')
    const extractedCity = parts[0]?.trim() || ""
    if (extractedCity && onCityChange) {
      onCityChange(extractedCity)
    }

    // Only search if user has typed at least 2 characters
    if (value.length < 2) {
      setLocationSuggestions([])
      return
    }

    setIsSearchingLocation(true)
    try {
      const suggestions = await searchLocations(value, 5)
      setLocationSuggestions(suggestions)
    } catch (error) {
      console.error("Error searching locations:", error)
      setLocationSuggestions([])
    } finally {
      setIsSearchingLocation(false)
    }
  }

  // Handle location selection from autocomplete
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    const formattedLocation = suggestion.city && suggestion.displayName.includes(suggestion.city)
      ? suggestion.displayName
      : `${suggestion.city || suggestion.displayName.split(',')[0]}, ${suggestion.displayName.split(',').pop()?.trim() || ''}`
    
    onLocationChange(formattedLocation)
    
    // Extract city and notify
    if (suggestion.city && onCityChange) {
      onCityChange(suggestion.city)
    } else {
      // Try to extract city from display name
      const cityFromName = suggestion.displayName.split(',')[0]?.trim()
      if (cityFromName && onCityChange) {
        onCityChange(cityFromName)
      }
    }
    
    setShowLocationSuggestions(false)
    setLocationSuggestions([])
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false)
      }
    }

    if (showLocationSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
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
              if (location.length >= 2) {
                setShowLocationSuggestions(true)
              }
            }}
            className="border-0 bg-transparent text-gray-800 font-medium text-sm sm:text-base min-w-0"
            placeholder="Everywhere"
          />
          {isSearchingLocation && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto top-full left-0">
              {locationSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleLocationSelect(suggestion)}
                  className="w-full text-left px-4 py-3 sm:py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors min-h-[44px] touch-manipulation"
                >
                  <div className="font-medium text-gray-900 text-sm sm:text-base">
                    {suggestion.city || suggestion.displayName.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.displayName}
                  </div>
                </button>
              ))}
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
