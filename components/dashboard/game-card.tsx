"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Flag, ExternalLink, Clock } from "lucide-react"
import type { Game } from "@/lib/db/models/types/game"
import Image from "next/image"
import { formatLocationForDisplay } from "@/lib/utils/location"

interface GameCardProps {
  game: Game
  onClick: () => void
  onReport: () => void
}

export function GameCard({ game, onClick, onReport }: GameCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative">
        <Image
          src={game.image || "/placeholder.svg"}
          alt={game.title}
          width={300}
          height={200}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="flex items-center gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-green-600 rounded-full"></div>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onReport()
            }}
            className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
          >
            <Flag className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4" onClick={onClick}>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{game.title}</h3>
          </div>

          {/* Sport Type */}
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {game.sport}
            </Badge>
          </div>

          {/* Skill Level */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Skill level:</span>
            <span>{game.skillLevel}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {(() => {
                const locationDisplay = formatLocationForDisplay(game.location)
                if (locationDisplay.isLink && locationDisplay.url) {
                  return (
                    <a
                      href={locationDisplay.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 break-words"
                      title={locationDisplay.text}
                    >
                      <span className="truncate">{locationDisplay.text}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  )
                }
                return <span className="break-words">{locationDisplay.text}</span>
              })()}
            </div>
          </div>

          {/* Time */}
          {(game.time || game.endTime) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {game.time}
                {game.endTime && ` - ${game.endTime}`}
              </span>
            </div>
          )}

          {/* Seats Left */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{game.seatsLeft} seats left</span>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">Join Team</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
