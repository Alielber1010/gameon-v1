"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"
import { CalendarIcon, MapPin, Users, Trophy, Clock, Loader2, ExternalLink, Image as ImageIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createGame } from "@/lib/api/games"
import { extractCoordinatesFromGoogleMapsLink, isValidGoogleMapsLink } from "@/lib/utils/google-maps"
import { reverseGeocode, searchLocations, type LocationSuggestion } from "@/lib/utils/geocoding"
import { SportSelector } from "@/components/dashboard/sport-selector"

interface CreateGameModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateGameModal({ isOpen, onClose, onSuccess }: CreateGameModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    sport: "",
    description: "",
    location: "",
    city: "",
    country: "",
    skillLevel: "",
    maxPlayers: "",
    date: undefined as Date | undefined,
    startTime: "",
    endTime: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isProcessingLocation, setIsProcessingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocationValidated, setIsLocationValidated] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<LocationSuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [isSearchingCity, setIsSearchingCity] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sport mapping: API value -> Display name (for backward compatibility)
  // Since we're now using the sport value directly, we don't need a mapping
  // But we keep this for any legacy conversions
  const sportMap: Record<string, string> = {
    "Football": "football",
    "Basketball": "basketball",
    "Badminton": "badminton",
    "Tennis": "tennis",
    "Volleyball": "volleyball",
    "Cricket": "cricket",
    "Ping Pong": "table-tennis",
    "Table Tennis": "table-tennis",
  }

  // Skill level mapping: Display name -> API value
  const skillLevelMap: Record<string, string> = {
    "Beginner": "beginner",
    "Intermediate": "intermediate",
    "Advanced": "advanced",
    "Professional": "advanced" // Map Professional to advanced
  }

  const skillLevels = ["Beginner", "Intermediate", "Advanced", "Professional"]

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setSelectedImage(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/games/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const data = await response.json()
    return data.imageUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.title || !formData.sport || !formData.location || 
          !formData.maxPlayers || !formData.date || !formData.startTime || !formData.endTime) {
        setError("Please fill in all required fields")
        setIsLoading(false)
        return
      }

      // Ensure description is not empty (API requires it)
      if (!formData.description || formData.description.trim() === '') {
        setError("Please provide a description for the game")
        setIsLoading(false)
        return
      }

      // Validate date - must be at least 1 day in advance (not same day)
      if (formData.date) {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day
        
        const selectedDate = new Date(formData.date)
        selectedDate.setHours(0, 0, 0, 0) // Reset time to start of day
        
        const daysDifference = Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDifference < 1) {
          setError("Games must be created at least 1 day in advance. Please select a date from tomorrow onwards.")
          setIsLoading(false)
          return
        }
      }

      // Validate time span - must be between 1 hour and 6 hours
      if (formData.startTime && formData.endTime) {
        const [startHours, startMinutes] = formData.startTime.split(':').map(Number)
        const [endHours, endMinutes] = formData.endTime.split(':').map(Number)
        
        const startTimeMinutes = startHours * 60 + startMinutes
        const endTimeMinutes = endHours * 60 + endMinutes
        
        let timeDifferenceMinutes = endTimeMinutes - startTimeMinutes
        
        // Handle case where end time is next day (shouldn't happen, but handle it)
        if (timeDifferenceMinutes < 0) {
          timeDifferenceMinutes += 24 * 60 // Add 24 hours
        }
        
        const timeDifferenceHours = timeDifferenceMinutes / 60
        
        if (timeDifferenceHours < 1) {
          setError("Game duration must be at least 1 hour. Please adjust the start and end times.")
          setIsLoading(false)
          return
        }
        
        if (timeDifferenceHours > 6) {
          setError("Game duration cannot exceed 6 hours. Please adjust the start and end times.")
          setIsLoading(false)
          return
        }
      }

      // Use sport value directly (it's already in the correct format from the dropdown)
      const apiSport = formData.sport
      
      // Transform skill level to lowercase API format
      const apiSkillLevel = skillLevelMap[formData.skillLevel] || formData.skillLevel.toLowerCase()

      // Format date as ISO string
      const dateISO = formData.date ? formData.date.toISOString().split('T')[0] : ''

      // Validate location: for mobile links, check isLocationValidated; for web links, check coordinates
      const isMobileLink = formData.location.includes('app') || formData.location.includes('maps.app.goo.gl')
      if (isMobileLink) {
        // Mobile link: require validation (city extracted)
        if (!isLocationValidated) {
          setError("Please provide a valid Google Maps link")
          setIsLoading(false)
          return
        }
      } else {
        // Web link: require coordinates
        if (!locationCoordinates) {
          setError("Please provide a valid Google Maps link with coordinates")
          setIsLoading(false)
          return
        }
      }

      // Upload image if selected
      let imageUrl = "/placeholder.svg?height=200&width=300"
      if (selectedImage) {
        setIsUploadingImage(true)
        try {
          imageUrl = await uploadImage(selectedImage)
        } catch (err: any) {
          setError(err.message || "Failed to upload image")
          setIsLoading(false)
          setIsUploadingImage(false)
          return
        }
        setIsUploadingImage(false)
      }

      // Prepare location data with coordinates from Google Maps link
      const locationData: any = {
        address: formData.location, // Store the Google Maps link
        city: formData.city || undefined,
        country: formData.country || undefined,
        coordinates: locationCoordinates || undefined, // Optional for mobile links
      }

      // Prepare API payload
      const gameData = {
        title: formData.title,
        sport: apiSport,
        description: formData.description || "Join us for a great game!",
        location: locationData,
        date: dateISO,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxPlayers: parseInt(formData.maxPlayers),
        skillLevel: apiSkillLevel as 'beginner' | 'intermediate' | 'advanced' | 'all',
        minSkillLevel: apiSkillLevel,
        image: imageUrl,
      }

      // Call API
      console.log('Creating game with data:', gameData)
      const response = await createGame(gameData)
      console.log('API response:', response)

      if (!response.success) {
        const errorMessage = response.error || "Failed to create game"
        console.error('Game creation failed:', errorMessage)
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      // Reset form and close modal
      setFormData({
        title: "",
        sport: "",
        description: "",
        location: "",
        city: "",
        country: "",
        skillLevel: "",
        maxPlayers: "",
        date: undefined,
        startTime: "",
        endTime: "",
      })
      setLocationCoordinates(null)
      setLocationError(null)
      setCitySuggestions([])
      setShowCitySuggestions(false)
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Call success callback to refresh games list
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (err: any) {
      console.error('Error creating game:', err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate time difference in hours
  const calculateTimeDifference = (startTime: string, endTime: string): number | null => {
    if (!startTime || !endTime) return null
    
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const startTimeMinutes = startHours * 60 + startMinutes
    const endTimeMinutes = endHours * 60 + endMinutes
    
    let timeDifferenceMinutes = endTimeMinutes - startTimeMinutes
    
    // Handle case where end time is next day (shouldn't happen, but handle it)
    if (timeDifferenceMinutes < 0) {
      timeDifferenceMinutes += 24 * 60 // Add 24 hours
    }
    
    return timeDifferenceMinutes / 60
  }

  // Get minimum end time (1 hour after start time)
  const getMinEndTime = (startTime: string): string | undefined => {
    if (!startTime) return undefined
    
    const [hours, minutes] = startTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const minEndMinutes = startMinutes + 60 // 1 hour minimum
    const minEndHours = Math.floor(minEndMinutes / 60) % 24
    const minEndMins = minEndMinutes % 60
    return `${String(minEndHours).padStart(2, '0')}:${String(minEndMins).padStart(2, '0')}`
  }

  // Handle city input with autocomplete
  const handleCityInputChange = async (value: string) => {
    handleInputChange("city", value)
    setShowCitySuggestions(true)

    // Only search if user has typed at least 2 characters
    if (value.length < 2) {
      setCitySuggestions([])
      return
    }

    setIsSearchingCity(true)
    try {
      const suggestions = await searchLocations(value, 5)
      setCitySuggestions(suggestions)
    } catch (error) {
      console.error("Error searching locations:", error)
      setCitySuggestions([])
    } finally {
      setIsSearchingCity(false)
    }
  }

  // Handle city selection from autocomplete
  const handleCitySelect = (suggestion: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      city: suggestion.city || suggestion.displayName.split(',')[0] || '',
      country: suggestion.displayName.split(',').pop()?.trim() || prev.country,
    }))
    setShowCitySuggestions(false)
    setCitySuggestions([])
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false)
      }
    }

    if (showCitySuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCitySuggestions])

  // Handle Google Maps link input
  const handleLocationLinkChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, location: value }))
    setLocationError(null)
    setLocationCoordinates(null)
    setIsLocationValidated(false)

    // Validate Google Maps link
    if (!value.trim()) {
      return
    }

    if (!isValidGoogleMapsLink(value)) {
      setLocationError("Please enter a valid Google Maps link")
      return
    }

    // Extract coordinates from the link
    setIsProcessingLocation(true)
    try {
      const linkData = await extractCoordinatesFromGoogleMapsLink(value)
      
      // Check if it's a mobile link (contains "app" in the URL)
      const isMobileLink = value.includes('maps.app.goo.gl') || value.includes('app')
      
      // For mobile links: only require city (coordinates are optional)
      // For web links: require coordinates
      if (!linkData || !linkData.isValid) {
        setLocationError(
          linkData?.error ||
            "Could not extract location information from this link. Please try sharing the location again."
        )
        setIsProcessingLocation(false)
        return
      }

      if (isMobileLink) {
        // Mobile link: city is required, coordinates are optional
        if (!linkData.city) {
          setLocationError(
            linkData?.error ||
              "Could not extract city information from this link. Please try sharing the location again."
          )
          setIsProcessingLocation(false)
          setIsLocationValidated(false)
          return
        }
        // Set coordinates if available, otherwise null
        setLocationCoordinates(linkData.coordinates || null)
        // Mark as validated since we have city
        setIsLocationValidated(true)
      } else {
        // Web link: coordinates are required
        if (!linkData.coordinates) {
          setLocationError(
            linkData?.error ||
              "Could not extract coordinates from this link. Please use a Google Maps link with coordinates (e.g., https://www.google.com/maps?q=lat,lng)"
          )
          setIsProcessingLocation(false)
          setIsLocationValidated(false)
          return
        }
        setLocationCoordinates(linkData.coordinates)
        setIsLocationValidated(true)
      }

      // For mobile links: keep the original mobile link (unwrapped URL is only for validation)
      // For web links: store the canonical URL if it was resolved
      if (!isMobileLink && linkData.resolvedUrl && linkData.resolvedUrl !== value) {
        setFormData((prev) => ({
          ...prev,
          location: linkData.resolvedUrl as string,
        }))
      }
      // For mobile links, the original link (value) is already in formData.location, so we don't change it
      
      // Step 1: Use city and country extracted from URL (if available)
      if (linkData.city || linkData.country) {
        setFormData((prev) => ({
          ...prev,
          city: linkData.city || prev.city,
          country: linkData.country || prev.country,
        }))
        // If we got city/country from URL, don't show suggestions
        if (linkData.city && linkData.country) {
          setShowCitySuggestions(false)
        }
      }
      
      // Step 2: Fallback to reverse geocoding if city/country not extracted from URL
      // Only do this for web links (mobile links already have city/country from URL)
      if (!isMobileLink && (!linkData.city || !linkData.country) && linkData.coordinates) {
        try {
          const geocodeResult = await reverseGeocode(linkData.coordinates.lat, linkData.coordinates.lng)
          if (geocodeResult) {
            setFormData((prev) => ({
              ...prev,
              city: linkData.city || geocodeResult.city || prev.city,
              country: linkData.country || geocodeResult.country || prev.country,
            }))
            // If we successfully got city/country, don't show suggestions
            if ((linkData.city || geocodeResult.city) && (linkData.country || geocodeResult.country)) {
              setShowCitySuggestions(false)
            }
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error)
          // Don't fail if reverse geocoding fails, coordinates are enough
          // User can manually enter city with autocomplete
        }
      }
      
      setLocationError(null)
    } catch (error) {
      console.error("Error processing Google Maps link:", error)
      setLocationError("Error processing the link. Please check the format and try again.")
    } finally {
      setIsProcessingLocation(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Create New Game
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Game Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Friday Night Football"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          {/* Sport and Skill Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <SportSelector
                value={formData.sport}
                onChange={(value) => handleInputChange("sport", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillLevel">Skill Level *</Label>
              <Select value={formData.skillLevel} onValueChange={(value) => handleInputChange("skillLevel", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your game, rules, or any special requirements..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Game Image (Optional)</Label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors"
                >
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WebP up to 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              {!imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload a photo of the court/venue, or leave empty to use a default image
            </p>
          </div>

          {/* Location and Max Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Google Maps Link *
                {isProcessingLocation && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-2" />
                )}
                {(locationCoordinates || isLocationValidated) && !isProcessingLocation && (
                  <span className="text-xs text-green-600 ml-2">✓ Location found</span>
                )}
              </Label>
              <Input
                id="location"
                type="url"
                placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps?q=lat,lng"
                value={formData.location}
                onChange={(e) => handleLocationLinkChange(e.target.value)}
                required
                className={locationError ? "border-red-500" : ""}
              />
              {locationError && (
                <p className="text-xs text-red-500">{locationError}</p>
              )}
              {locationCoordinates && (
                <p className="text-xs text-green-600">
                  ✓ Coordinates: {locationCoordinates.lat.toFixed(6)}, {locationCoordinates.lng.toFixed(6)}
                </p>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">How to get a Google Maps link:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open Google Maps on your phone or computer</li>
                  <li>Find the sport court location</li>
                  <li>Tap/click on the location to place a pin</li>
                  <li>Click "Share" or right-click and select "Copy link"</li>
                  <li>Paste the link here (mobile app links work too!)</li>
                </ol>
                <p className="mt-2">
                  <ExternalLink className="h-3 w-3 inline mr-1" />
                  Supported formats:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><code className="text-xs bg-gray-100 px-1 rounded">https://maps.app.goo.gl/...</code> (Mobile app)</li>
                  <li><code className="text-xs bg-gray-100 px-1 rounded">https://www.google.com/maps?q=lat,lng</code> (Web)</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlayers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Players *
              </Label>
              <Input
                id="maxPlayers"
                type="number"
                min="2"
                max="50"
                placeholder="e.g., 10"
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange("maxPlayers", e.target.value)}
                required
              />
            </div>
          </div>

          {/* City and Country - auto-filled from location, but can be edited */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative" ref={cityInputRef}>
              <Label htmlFor="city">City (Optional)</Label>
              <div className="relative">
                <Input
                  id="city"
                  placeholder="e.g., Johor Bahru"
                  value={formData.city}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  onFocus={() => {
                    if (formData.city.length >= 2) {
                      setShowCitySuggestions(true)
                    }
                  }}
                />
                {isSearchingCity && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {citySuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCitySelect(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                      >
                        <div className="font-medium text-gray-900">
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
              <p className="text-xs text-gray-500">
                {locationCoordinates 
                  ? "Change in case incorrect location" 
                  : "Type to search for a city (autocomplete available)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country (Optional)</Label>
              <Input
                id="country"
                placeholder="e.g., Malaysia"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
              />
              <p className="text-xs text-gray-500">Change in case incorrect location</p>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => handleInputChange("date", date)}
                    initialFocus
                    disabled={(date) => {
                      // Disable today and past dates - only allow dates from tomorrow onwards
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const dateToCheck = new Date(date)
                      dateToCheck.setHours(0, 0, 0, 0)
                      return dateToCheck <= today
                    }}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Games must be created at least 1 day in advance</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start & End Time *
              </Label>
              <TimePicker
                startTime={formData.startTime}
                endTime={formData.endTime}
                onStartTimeChange={(time) => handleInputChange("startTime", time)}
                onEndTimeChange={(time) => handleInputChange("endTime", time)}
                label="Time Range"
              />
              <p className="text-xs text-gray-500">Duration must be between 1 hour and 6 hours</p>
              {(() => {
                if (!formData.startTime || !formData.endTime) return null
                
                const timeDifferenceHours = calculateTimeDifference(formData.startTime, formData.endTime)
                if (timeDifferenceHours === null) return null
                
                if (timeDifferenceHours < 1) {
                  return <p className="text-xs text-red-500">Duration must be at least 1 hour</p>
                }
                if (timeDifferenceHours > 6) {
                  return <p className="text-xs text-red-500">Duration cannot exceed 6 hours</p>
                }
                return <p className="text-xs text-green-600">Duration: {timeDifferenceHours.toFixed(1)} hours</p>
              })()}
            </div>
          </div>


          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={
                isLoading ||
                isUploadingImage ||
                !formData.title ||
                !formData.sport ||
                !formData.location ||
                !formData.maxPlayers ||
                !formData.date ||
                !formData.startTime ||
                !formData.endTime
              }
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading image...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Game"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
