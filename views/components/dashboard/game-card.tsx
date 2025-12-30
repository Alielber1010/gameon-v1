"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Flag } from "lucide-react"
import type { Game } from "@/lib/db/models/types/game"
import Image from "next/image"

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
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {game.sport}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{game.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Skill level:</span>
            <span>{game.skillLevel}</span>
          </div>

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
