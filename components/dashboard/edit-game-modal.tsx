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
import { updateGame, getGameById } from "@/lib/api/games"
import { extractCoordinatesFromGoogleMapsLink, isValidGoogleMapsLink } from "@/lib/utils/google-maps"
import { reverseGeocode, searchLocations, type LocationSuggestion } from "@/lib/utils/geocoding"
import type { Game } from "@/lib/db/models/types/game"
import { toast } from "sonner"

interface EditGameModalProps {
  isOpen: boolean
  onClose: () => void
  game: Game | null
  onSuccess?: () => void
}

export function EditGameModal({ isOpen, onClose, game, onSuccess }: EditGameModalProps) {
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
  const [citySuggestions, setCitySuggestions] = useState<LocationSuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [isSearchingCity, setIsSearchingCity] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sport mapping: Display name -> API value
  const sportMap: Record<string, string> = {
    "Football": "football",
    "Basketball": "basketball",
    "Badminton": "badminton",
    "Tennis": "tennis",
    "Volleyball": "volleyball",
    "Cricket": "cricket",
    "Ping Pong": "pingpong"
  }

  // Reverse sport mapping: API value -> Display name
  const reverseSportMap: Record<string, string> = {
    "football": "Football",
    "basketball": "Basketball",
    "badminton": "Badminton",
    "tennis": "Tennis",
    "volleyball": "Volleyball",
    "cricket": "Cricket",
    "pingpong": "Ping Pong"
  }

  // Skill level mapping: Display name -> API value
  const skillLevelMap: Record<string, string> = {
    "Beginner": "beginner",
    "Intermediate": "intermediate",
    "Advanced": "advanced",
    "Professional": "advanced"
  }

  // Reverse skill level mapping
  const reverseSkillLevelMap: Record<string, string> = {
    "beginner": "Beginner",
    "intermediate": "Intermediate",
    "advanced": "Advanced",
    "all": "All Levels"
  }

  const sports = ["Football", "Basketball", "Badminton", "Tennis", "Volleyball", "Cricket", "Ping Pong"]
  const skillLevels = ["Beginner", "Intermediate", "Advanced", "Professional"]

  // Load game data into form when modal opens or game changes
  useEffect(() => {
    const loadGameData = async () => {
      if (game && isOpen && game.id) {
        // Fetch full game data to get accurate maxPlayers
        try {
          const response = await getGameById(game.id)
          if (response.success && response.data) {
            const fullGame = response.data
            const locationObj = typeof fullGame.location === 'string' ? { address: fullGame.location } : fullGame.location
            
            // Parse date - handle both string and Date formats
            let gameDate: Date | undefined = undefined
            if (fullGame.date) {
              if (typeof fullGame.date === 'string') {
                gameDate = new Date(fullGame.date)
              } else {
                gameDate = new Date(fullGame.date)
              }
            }
            
            setFormData({
              title: fullGame.title || "",
              sport: reverseSportMap[fullGame.sport] || fullGame.sport || "",
              description: fullGame.description || "",
              location: locationObj?.address || "",
              city: locationObj?.city || "",
              country: locationObj?.country || "",
              skillLevel: reverseSkillLevelMap[fullGame.skillLevel] || fullGame.skillLevel || "",
              maxPlayers: fullGame.maxPlayers ? String(fullGame.maxPlayers) : String((fullGame.seatsLeft || 0) + (fullGame.registeredPlayers?.length || 0)),
              date: gameDate,
              startTime: fullGame.startTime || fullGame.time || "",
              endTime: fullGame.endTime || "",
            })
            
            if (locationObj?.coordinates) {
              setLocationCoordinates(locationObj.coordinates)
            }
            
            if (fullGame.image) {
              setImagePreview(fullGame.image)
            }
          }
        } catch (error) {
          console.error('Error loading game data:', error)
          // Fallback to using the game prop data
          const locationObj = typeof game.location === 'string' ? { address: game.location } : game.location
          const estimatedMaxPlayers = (game.seatsLeft || 0) + (game.teamMembers || 0)
          let gameDate: Date | undefined = undefined
          if (game.date) {
            gameDate = typeof game.date === 'string' ? new Date(game.date) : new Date(game.date)
          }
          
          setFormData({
            title: game.title || "",
            sport: reverseSportMap[game.sport] || game.sport || "",
            description: game.description || "",
            location: locationObj?.address || "",
            city: locationObj?.city || "",
            country: locationObj?.country || "",
            skillLevel: reverseSkillLevelMap[game.skillLevel] || game.skillLevel || "",
            maxPlayers: estimatedMaxPlayers > 0 ? String(estimatedMaxPlayers) : "",
            date: gameDate,
            startTime: game.time || "",
            endTime: game.endTime || "",
          })
          
          if (locationObj?.coordinates) {
            setLocationCoordinates(locationObj.coordinates)
          }
          
          if (game.image) {
            setImagePreview(game.image)
          }
        }
      }
    }
    
    loadGameData()
  }, [game, isOpen])

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setSelectedImage(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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

  // Handle location input
  const handleLocationChange = async (value: string) => {
    setFormData(prev => ({ ...prev, location: value }))
    setLocationError(null)

    if (!value.trim()) {
      setLocationCoordinates(null)
      return
    }

    if (isValidGoogleMapsLink(value)) {
      setIsProcessingLocation(true)
      try {
        const coordsData = await extractCoordinatesFromGoogleMapsLink(value)
        if (coordsData && coordsData.coordinates) {
          const coords = coordsData.coordinates
          setLocationCoordinates(coords)
          const locationData = await reverseGeocode(coords.lat, coords.lng)
          if (locationData) {
            setFormData(prev => ({
              ...prev,
              city: locationData.city || prev.city,
              country: locationData.country || prev.country,
            }))
          }
        }
      } catch (err: any) {
        console.error('Error processing location:', err)
        setLocationError('Failed to process location')
      } finally {
        setIsProcessingLocation(false)
      }
    }
  }

  // Handle city search
  const handleCitySearch = async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([])
      setShowCitySuggestions(false)
      return
    }

    setIsSearchingCity(true)
    try {
      const suggestions = await searchLocations(query)
      setCitySuggestions(suggestions)
      setShowCitySuggestions(true)
    } catch (err) {
      console.error('Error searching cities:', err)
    } finally {
      setIsSearchingCity(false)
    }
  }

  const handleCitySelect = (suggestion: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      city: suggestion.city || '',
      country: '', // LocationSuggestion doesn't have country, keep existing or empty
    }))
    setCitySuggestions([])
    setShowCitySuggestions(false)
    if (cityInputRef.current) {
      cityInputRef.current.value = suggestion.city || ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!game) return

    setIsLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.title.trim()) {
        setError("Title is required")
        setIsLoading(false)
        return
      }

      if (!formData.sport) {
        setError("Sport is required")
        setIsLoading(false)
        return
      }

      if (!formData.location.trim()) {
        setError("Location is required")
        setIsLoading(false)
        return
      }

      if (!formData.date) {
        setError("Date is required")
        setIsLoading(false)
        return
      }

      if (!formData.startTime || !formData.endTime) {
        setError("Start time and end time are required")
        setIsLoading(false)
        return
      }

      if (!formData.maxPlayers || parseInt(formData.maxPlayers) < 2) {
        setError("Max players must be at least 2")
        setIsLoading(false)
        return
      }

      const apiSport = sportMap[formData.sport] || formData.sport.toLowerCase()
      const apiSkillLevel = skillLevelMap[formData.skillLevel] || formData.skillLevel.toLowerCase()

      // Format date
      const dateISO = formData.date.toISOString().split('T')[0]

      // Upload image if selected
      let imageUrl = game.image || "/placeholder.svg?height=200&width=300"
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

      // Prepare location data
      const locationData: any = {
        address: formData.location,
        city: formData.city || undefined,
        country: formData.country || undefined,
        coordinates: locationCoordinates,
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
      const response = await updateGame(game.id, gameData)

      if (!response.success) {
        const errorMessage = response.error || "Failed to update game"
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      toast.success('Game updated successfully!')
      
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
      setSelectedImage(null)
      setImagePreview(null)
      setError(null)
      
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Error updating game:', err)
      setError(err.message || "Failed to update game")
    } finally {
      setIsLoading(false)
    }
  }

  if (!game) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Game</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Game Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Evening Basketball Match"
              required
            />
          </div>

          {/* Sport and Skill Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sport">Sport *</Label>
              <Select value={formData.sport} onValueChange={(value) => setFormData(prev => ({ ...prev, sport: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillLevel">Skill Level *</Label>
              <Select value={formData.skillLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, skillLevel: value }))}>
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
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your game..."
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Google Maps Link) *</Label>
            <div className="space-y-2">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="https://maps.google.com/..."
                required
              />
              {isProcessingLocation && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing location...
                </p>
              )}
              {locationError && (
                <p className="text-sm text-red-500">{locationError}</p>
              )}
            </div>
          </div>

          {/* City and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <div className="relative">
                <Input
                  id="city"
                  ref={cityInputRef}
                  defaultValue={formData.city}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  placeholder="Search city..."
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {citySuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCitySelect(suggestion)}
                      >
                        <div className="font-medium">{suggestion.city || suggestion.displayName}</div>
                        <div className="text-sm text-gray-500">{suggestion.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Country"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
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
                  onSelect={(date) => setFormData(prev => ({ ...prev, date: date }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label>Time *</Label>
            <TimePicker
              startTime={formData.startTime}
              endTime={formData.endTime}
              onStartTimeChange={(time: string) => setFormData(prev => ({ ...prev, startTime: time }))}
              onEndTimeChange={(time: string) => setFormData(prev => ({ ...prev, endTime: time }))}
            />
          </div>

          {/* Max Players */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players *</Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              value={formData.maxPlayers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: e.target.value }))}
              placeholder="e.g., 10"
              required
            />
          </div>


          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Game Image</Label>
            <div className="space-y-2">
              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {imagePreview ? "Change Image" : "Upload Image"}
              </Button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage} className="bg-green-600 hover:bg-green-700">
              {isLoading || isUploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploadingImage ? "Uploading..." : "Updating..."}
                </>
              ) : (
                "Update Game"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

