"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Circle, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Game {
  id: string
  title: string
  sport: string
  location: string
  city: string
  date: string
  startTime: string
  endTime: string
  maxPlayers: number
  status: string
  hostId: string
  hostName: string
  hostEmail: string
  image: string
  createdAt: string
  reportCount: number
  priority: 'green' | 'yellow' | 'red'
}

interface GamesTableProps {
  games: Game[]
  onGameClick?: (game: Game) => void
}

export function GamesTable({ games, onGameClick }: GamesTableProps) {
  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getPriorityColor = (priority: 'green' | 'yellow' | 'red') => {
    switch (priority) {
      case 'green':
        return 'text-green-500 fill-green-500'
      case 'yellow':
        return 'text-yellow-500 fill-yellow-500'
      case 'red':
        return 'text-red-500 fill-red-500'
      default:
        return 'text-gray-500 fill-gray-500'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'default'
      case 'ongoing':
        return 'secondary'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No games found.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Priority</TableHead>
            <TableHead>Game</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Reports</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow
              key={game.id}
              className="hover:bg-gray-50"
            >
              <TableCell>
                <Circle
                  className={cn("h-4 w-4", getPriorityColor(game.priority))}
                  fill="currentColor"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={game.image} alt={game.title} />
                    <AvatarFallback>{game.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{game.title}</div>
                    <div className="text-sm text-gray-500">
                      {game.maxPlayers} players max
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{game.sport}</Badge>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="truncate">
                  <div className="font-medium truncate" title={game.location}>
                    {game.location}
                  </div>
                  {game.city && (
                    <div className="text-sm text-gray-500 truncate" title={game.city}>
                      {game.city}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="min-w-[150px]">
                <div>
                  <div className="font-medium">{formatDate(game.date)}</div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {game.startTime} - {game.endTime}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{game.hostName}</div>
                  <div className="text-sm text-gray-500">{game.hostEmail}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(game.status)}>
                  {game.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    game.reportCount === 0
                      ? 'outline'
                      : game.reportCount <= 5
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="font-semibold"
                >
                  {game.reportCount}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onGameClick?.(game)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
