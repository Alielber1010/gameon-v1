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
import { CalendarIcon, MapPin, Users, Trophy, Clock, Loader2, ExternalLink, Image as ImageIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { updateGame, getGameById } from "@/lib/api/games"
import { extractCoordinatesFromGoogleMapsLink, isValidGoogleMapsLink } from "@/lib/utils/google-maps"
import { reverseGeocode, searchLocations, type LocationSuggestion } from "@/lib/utils/geocoding"
import type { Game } from "@/lib/db/models/types/game"
import { toast } from "sonner"
import { SportSelector } from "@/components/dashboard/sport-selector"

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
  const [isLocationValidated, setIsLocationValidated] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<LocationSuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [isSearchingCity, setIsSearchingCity] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const cityInputRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const locationDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const skillLevelMap: Record<string, string> = {
    "Beginner": "beginner",
    "Intermediate": "intermediate",
    "Advanced": "advanced",
    "Professional": "advanced",
  }

  const reverseSkillLevelMap: Record<string, string> = {
    "beginner": "Beginner",
    "intermediate": "Intermediate",
    "advanced": "Advanced",
    "all": "All Levels",
  }

  const skillLevels = ["Beginner", "Intermediate", "Advanced", "Professional"]

  // Calculate time difference in hours
  const calculateTimeDifference = (startTime: string, endTime: string): number | null => {
    if (!startTime || !endTime) return null
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 0) diff += 24 * 60
    return diff / 60
  }

  // Load game data into form when modal opens
  useEffect(() => {
    const loadGameData = async () => {
      if (!game || !isOpen || !game.id) return
      try {
        const response = await getGameById(game.id)
        if (response.success && response.data) {
          const fullGame = response.data
          const locationObj = typeof fullGame.location === 'string' ? { address: fullGame.location } : fullGame.location
          let gameDate: Date | undefined
          if (fullGame.date) gameDate = new Date(fullGame.date)

          setFormData({
            title: fullGame.title || "",
            sport: fullGame.sport || "",
            description: fullGame.description || "",
            location: locationObj?.address || "",
            city: locationObj?.city || "",
            country: locationObj?.country || "",
            skillLevel: reverseSkillLevelMap[fullGame.skillLevel] || fullGame.skillLevel || "",
            maxPlayers: fullGame.maxPlayers
              ? String(fullGame.maxPlayers)
              : String((fullGame.seatsLeft || 0) + (fullGame.registeredPlayers?.length || 0)),
            date: gameDate,
            startTime: fullGame.startTime || fullGame.time || "",
            endTime: fullGame.endTime || "",
          })

          if (locationObj?.coordinates) {
            setLocationCoordinates(locationObj.coordinates)
            setIsLocationValidated(true)
          }
          if (fullGame.image && !fullGame.image.includes('placeholder')) {
            setImagePreview(fullGame.image)
          }
        }
      } catch (err) {
        console.error('Error loading game data:', err)
        // Fallback to prop data
        const locationObj = typeof game.location === 'string' ? { address: game.location } : game.location
        let gameDate: Date | undefined
        if (game.date) gameDate = new Date(game.date)

        setFormData({
          title: game.title || "",
          sport: game.sport || "",
          description: game.description || "",
          location: locationObj?.address || "",
          city: locationObj?.city || "",
          country: locationObj?.country || "",
          skillLevel: reverseSkillLevelMap[game.skillLevel] || game.skillLevel || "",
          maxPlayers: String((game.seatsLeft || 0) + (game.registeredPlayers?.length || 0) + 1),
          date: gameDate,
          startTime: game.time || "",
          endTime: game.endTime || "",
        })
        if (locationObj?.coordinates) {
          setLocationCoordinates(locationObj.coordinates)
          setIsLocationValidated(true)
        }
        if (game.image && !game.image.includes('placeholder')) {
          setImagePreview(game.image)
        }
      }
    }
    loadGameData()
  }, [game, isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setLocationError(null)
      setSelectedImage(null)
      setShowCitySuggestions(false)
    }
  }, [isOpen])

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image size must be less than 5MB'); return }
    setSelectedImage(file)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('image', file)
    const response = await fetch('/api/games/upload-image', { method: 'POST', body: fd })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to upload image')
    }
    const data = await response.json()
    return data.imageUrl
  }

  // Handle city input with autocomplete
  const handleCityInputChange = async (value: string) => {
    handleInputChange("city", value)
    setShowCitySuggestions(true)
    if (value.length < 2) { setCitySuggestions([]); return }
    setIsSearchingCity(true)
    try {
      const suggestions = await searchLocations(value, 5)
      setCitySuggestions(suggestions)
    } catch { setCitySuggestions([]) } finally { setIsSearchingCity(false) }
  }

  const handleCitySelect = (suggestion: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      city: suggestion.city || suggestion.displayName.split(',')[0] || '',
      country: suggestion.displayName.split(',').pop()?.trim() || prev.country,
    }))
    setShowCitySuggestions(false)
    setCitySuggestions([])
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false)
      }
    }
    if (showCitySuggestions) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCitySuggestions])

  useEffect(() => {
    return () => { if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current) }
  }, [isOpen])

  // Handle Google Maps link input with debouncing
  const handleLocationLinkChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, location: value }))
    setLocationError(null)
    setLocationCoordinates(null)
    setIsLocationValidated(false)

    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current)
    if (!value.trim()) return
    if (!isValidGoogleMapsLink(value)) { setLocationError("Please enter a valid Google Maps link"); return }

    locationDebounceRef.current = setTimeout(async () => {
      setIsProcessingLocation(true)
      try {
        const linkData = await extractCoordinatesFromGoogleMapsLink(value)
        const isMobileLink = value.includes('maps.app.goo.gl') || value.includes('app')

        if (!linkData || !linkData.isValid) {
          setLocationError(linkData?.error || "Could not extract location from this link. Please try again.")
          return
        }

        if (isMobileLink) {
          if (!linkData.city) { setLocationError("Could not extract city from this link."); return }
          setLocationCoordinates(linkData.coordinates || null)
          setIsLocationValidated(true)
        } else {
          if (!linkData.coordinates) { setLocationError("Could not extract coordinates from this link."); return }
          setLocationCoordinates(linkData.coordinates)
          setIsLocationValidated(true)
        }

        if (linkData.city || linkData.country) {
          setFormData((prev) => ({
            ...prev,
            city: linkData.city || prev.city,
            country: linkData.country || prev.country,
          }))
        }

        if (!isMobileLink && (!linkData.city || !linkData.country) && linkData.coordinates) {
          try {
            const geo = await reverseGeocode(linkData.coordinates.lat, linkData.coordinates.lng)
            if (geo) setFormData((prev) => ({ ...prev, city: linkData.city || geo.city || prev.city, country: linkData.country || geo.country || prev.country }))
          } catch { /* ignore */ }
        }
        setLocationError(null)
      } catch { setLocationError("Error processing the link. Please check the format and try again.") }
      finally { setIsProcessingLocation(false) }
    }, 800)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!game) return
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.title.trim()) { setError("Title is required"); return }
      if (!formData.sport) { setError("Sport is required"); return }
      if (!formData.location.trim()) { setError("Location is required"); return }
      if (!formData.date) { setError("Date is required"); return }
      if (!formData.startTime || !formData.endTime) { setError("Start time and end time are required"); return }
      if (!formData.maxPlayers || parseInt(formData.maxPlayers) < 2) { setError("Max players must be at least 2"); return }

      // Validate date is not in the past
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(formData.date); selectedDate.setHours(0, 0, 0, 0)
      if (selectedDate < today) { setError("Please select today or a future date."); return }

      // Validate time span
      if (formData.startTime && formData.endTime) {
        const diff = calculateTimeDifference(formData.startTime, formData.endTime)
        if (diff !== null && diff < 1) { setError("Game duration must be at least 1 hour."); return }
        if (diff !== null && diff > 6) { setError("Game duration cannot exceed 6 hours."); return }
      }

      const apiSkillLevel = skillLevelMap[formData.skillLevel] || formData.skillLevel.toLowerCase()
      const dateISO = formData.date.toISOString().split('T')[0]

      let imageUrl = game.image || "/placeholder.svg?height=200&width=300"
      if (selectedImage) {
        setIsUploadingImage(true)
        try { imageUrl = await uploadImage(selectedImage) }
        catch (err: any) { setError(err.message || "Failed to upload image"); return }
        finally { setIsUploadingImage(false) }
      }

      const locationData: any = {
        address: formData.location,
        city: formData.city || undefined,
        country: formData.country || undefined,
        coordinates: locationCoordinates || undefined,
      }

      const gameData = {
        title: formData.title,
        sport: formData.sport,
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

      const response = await updateGame(game.id, gameData)
      if (!response.success) { setError(response.error || "Failed to update game"); return }

      toast.success('Game updated successfully!')
      onClose()
      if (onSuccess) onSuccess()
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
      <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[95vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Edit Game
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

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
                    <SelectItem key={level} value={level}>{level}</SelectItem>
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
            <Label>Game Image (Optional)</Label>
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
                  <p className="text-sm text-gray-600 mb-1">Click to upload an image</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
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
            <p className="text-xs text-gray-500">Upload a photo of the venue, or leave empty to keep the current image</p>
          </div>

          {/* Location and Max Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Google Maps Link *
                {isProcessingLocation && <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-2" />}
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
              {locationError && <p className="text-xs text-red-500">{locationError}</p>}
              {locationCoordinates && (
                <p className="text-xs text-green-600">
                  ✓ Coordinates: {locationCoordinates.lat.toFixed(6)}, {locationCoordinates.lng.toFixed(6)}
                </p>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">How to get a Google Maps link:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open Google Maps, find the location</li>
                  <li>Tap on the location to place a pin</li>
                  <li>Tap "Share" and copy the link</li>
                  <li>Paste it here</li>
                </ol>
                <p className="mt-2">
                  <ExternalLink className="h-3 w-3 inline mr-1" />
                  Supports mobile app links and web links
                </p>
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

          {/* City and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative" ref={cityInputRef}>
              <Label htmlFor="city">City (Optional)</Label>
              <div className="relative">
                <Input
                  id="city"
                  placeholder="e.g., Johor Bahru"
                  value={formData.city}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  onFocus={() => { if (formData.city.length >= 2) setShowCitySuggestions(true) }}
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
                        <div className="font-medium text-gray-900">{suggestion.city || suggestion.displayName.split(',')[0]}</div>
                        <div className="text-xs text-gray-500 truncate">{suggestion.displayName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {locationCoordinates ? "Change in case incorrect location" : "Type to search for a city"}
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
                    className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}
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
                      const today = new Date(); today.setHours(0, 0, 0, 0)
                      const d = new Date(date); d.setHours(0, 0, 0, 0)
                      return d < today
                    }}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Today or any future date</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start & End Time *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startTime" className="text-xs text-gray-500">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endTime" className="text-xs text-gray-500">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Duration must be between 1 hour and 6 hours</p>
              {(() => {
                if (!formData.startTime || !formData.endTime) return null
                const diff = calculateTimeDifference(formData.startTime, formData.endTime)
                if (diff === null) return null
                if (diff < 1) return <p className="text-xs text-red-500">Duration must be at least 1 hour</p>
                if (diff > 6) return <p className="text-xs text-red-500">Duration cannot exceed 6 hours</p>
                return <p className="text-xs text-green-600">Duration: {diff.toFixed(1)} hours</p>
              })()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading image...</>
              ) : isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
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
