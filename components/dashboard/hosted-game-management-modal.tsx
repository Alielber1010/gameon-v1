"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, X, Check, Users } from "lucide-react"
import type { Game, JoinRequest, Player } from "@/types/game"
import Image from "next/image"

interface HostedGameManagementModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onUserClick: (user: Player | JoinRequest) => void
  onAcceptRequest: (gameId: string, requestId: string) => void
  onRejectRequest: (gameId: string, requestId: string) => void
  onRemovePlayer: (gameId: string, playerId: string, team: "blue" | "red") => void
}

export function HostedGameManagementModal({
  game,
  isOpen,
  onClose,
  onUserClick,
  onAcceptRequest,
  onRejectRequest,
  onRemovePlayer,
}: HostedGameManagementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{game.sport.toUpperCase()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Image */}
          <div className="relative">
            <Image
              src={game.image || "/placeholder.svg"}
              alt={game.title}
              width={800}
              height={200}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>

          {/* Game Details */}
          <div className="space-y-4">
            <p className="text-gray-600">
              Game Description: {game.description || "a friendly match in football we just wanna have a good time"}
            </p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>🎯</span>
                  Skill level: {game.skillLevel}+
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>👥</span>
                  Age Range: 18-40
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Date: Fri, May 16</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Time: 6:00 PM - 7:30 PM</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{game.location}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Teams Section */}
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {/* Team Blue */}
              <div className="bg-blue-100 p-6 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-4 text-lg">TEAM BLUE</h4>
                <div className="space-y-3">
                  {game.teamBlue?.map((player) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-blue-200 p-2 rounded"
                        onClick={() => onUserClick(player)}
                      >
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                        onClick={() => onRemovePlayer(game.id, player.id, "blue")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Red */}
              <div className="bg-red-100 p-6 rounded-lg">
                <h4 className="font-bold text-red-800 mb-4 text-lg">TEAM RED</h4>
                <div className="space-y-3">
                  {game.teamRed?.map((player) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-red-200 p-2 rounded"
                        onClick={() => onUserClick(player)}
                      >
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                        onClick={() => onRemovePlayer(game.id, player.id, "red")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Join Requests Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg">JOIN REQUEST</h4>
                <div className="flex items-center gap-2 text-red-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">{game.seatsLeft} seats left</span>
                </div>
              </div>

              <div className="space-y-4">
                {game.joinRequests?.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded flex-1"
                      onClick={() => onUserClick(request)}
                    >
                      <Image
                        src={request.userImage || "/placeholder.svg"}
                        alt={request.userName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{request.userName}</div>
                        <div className="text-sm text-gray-600">
                          {request.userAge}, {request.userSkillLevel}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        onClick={() => onAcceptRequest(game.id, request.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => onRejectRequest(game.id, request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {(!game.joinRequests || game.joinRequests.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              Leave
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
