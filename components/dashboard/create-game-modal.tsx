"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, MapPin, Users, Trophy, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Game } from "@/types/game"

interface CreateGameModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGameModal({ isOpen, onClose }: CreateGameModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    sport: "",
    description: "",
    location: "",
    skillLevel: "",
    maxPlayers: "",
    date: undefined as Date | undefined,
    time: "",
    whatsapp: "",
  })

  const sports = ["Football", "Basketball", "Badminton", "Tennis", "Volleyball", "Cricket", "Hiking"]
  const skillLevels = ["Beginner", "Intermediate", "Advanced", "Professional"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create new game object
    const newGame: Omit<Game, "id"> = {
      title: formData.title,
      sport: formData.sport,
      description: formData.description,
      location: formData.location,
      skillLevel: formData.skillLevel,
      seatsLeft: Number.parseInt(formData.maxPlayers),
      date: formData.date ? format(formData.date, "PPP") : "",
      time: formData.time,
      image: "/placeholder.svg?height=200&width=300",
      hostWhatsApp: formData.whatsapp,
      teamMembers: 0,
      minSkillLevel: formData.skillLevel,
    }

    // Store in localStorage for now (in real app, this would be an API call)
    const existingGames = JSON.parse(localStorage.getItem("hostedGames") || "[]")
    const gameWithId = { ...newGame, id: Date.now().toString() }
    existingGames.push(gameWithId)
    localStorage.setItem("hostedGames", JSON.stringify(existingGames))

    // Reset form and close modal
    setFormData({
      title: "",
      sport: "",
      description: "",
      location: "",
      skillLevel: "",
      maxPlayers: "",
      date: undefined,
      time: "",
      whatsapp: "",
    })
    onClose()
  }

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
            <div className="space-y-2">
              <Label htmlFor="sport">Sport *</Label>
              <Select value={formData.sport} onValueChange={(value) => handleInputChange("sport", value)}>
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

          {/* Location and Max Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location *
              </Label>
              <Input
                id="location"
                placeholder="e.g., Central Park, Austin"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required
              />
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
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                required
              />
            </div>
          </div>

          {/* WhatsApp Contact */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
            <Input
              id="whatsapp"
              placeholder="e.g., +1234567890"
              value={formData.whatsapp}
              onChange={(e) => handleInputChange("whatsapp", e.target.value)}
            />
            <p className="text-sm text-gray-500">Players will be able to contact you via WhatsApp if provided</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={
                !formData.title ||
                !formData.sport ||
                !formData.location ||
                !formData.maxPlayers ||
                !formData.date ||
                !formData.time
              }
            >
              Create Game
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
