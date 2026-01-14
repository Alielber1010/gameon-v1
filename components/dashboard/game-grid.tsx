"use client"

import { GameCard } from "./game-card"
import type { Game } from "@/lib/db/models/types/game"

interface GameGridProps {
  games: Game[]
  onGameClick: (game: Game) => void
  onReportClick: (game: Game) => void
}

export function GameGrid({ games, onGameClick, onReportClick }: GameGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onClick={() => onGameClick(game)} onReport={() => onReportClick(game)} />
      ))}
    </div>
  )
}
