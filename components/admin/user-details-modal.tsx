"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, MapPin, Calendar, Trophy, Star, Gamepad2, AlertTriangle, Ban, Shield, ShieldCheck } from "lucide-react"
import type { User as UserType } from "./users-table"
import { WarningNotificationForm } from "./warning-notification-form"
import { BanUserModal } from "./ban-user-modal"
import { BanSuccessModal } from "./ban-success-modal"

interface Game {
  id: string
  title: string
  sport: string
  date: string
  status: string
  isHost: boolean
}

interface UserDetailsModalProps {
  user: UserType | null
  games: Game[]
  isOpen: boolean
  onClose: () => void
  loadingGames?: boolean
  onUserUpdated?: () => void
}

export function UserDetailsModal({ user, games, isOpen, onClose, loadingGames = false, onUserUpdated }: UserDetailsModalProps) {
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [successBanState, setSuccessBanState] = useState(false)

  if (!user) return null

  const handleBanToggle = () => {
    console.log('[UserDetailsModal] Ban toggle clicked, current user state:', {
      id: user.id,
      name: user.name,
      isBanned: user.isBanned
    })
    setShowBanModal(true)
  }

  const handleBanSuccess = (wasBanned: boolean) => {
    console.log('[UserDetailsModal] Ban success callback, wasBanned:', wasBanned)
    setSuccessBanState(wasBanned)
    setShowSuccessModal(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700"
      case "user":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "upcoming":
        return "bg-blue-100 text-blue-700"
      case "ongoing":
        return "bg-yellow-100 text-yellow-700"
      case "cancelled":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const hostedGames = games.filter((g) => g.isHost).length
  const joinedGames = games.filter((g) => !g.isHost).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-red-600" />
            User Details
          </DialogTitle>
          <DialogDescription>View user information and game history</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">{user.name}</h3>
                <Badge className={getRoleColor(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                {user.isBanned && (
                  <Badge className="bg-red-100 text-red-700">
                    BANNED
                  </Badge>
                )}
              </div>
              {user.bio && (
                <p className="text-sm text-gray-600 mb-3">{user.bio}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowWarningForm(true)}
                  disabled={user.isBanned}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Send Warning
                </Button>
                
                {/* Toggle Ban Button */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Account Status:</span>
                  <button
                    onClick={handleBanToggle}
                    disabled={isToggling}
                    className={`
                      relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${user.isBanned 
                        ? 'bg-red-600 focus:ring-red-500' 
                        : 'bg-green-600 focus:ring-green-500'
                      }
                      ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ease-in-out flex items-center justify-center
                        ${user.isBanned ? 'translate-x-1' : 'translate-x-9'}
                      `}
                    >
                      {user.isBanned ? (
                        <Ban className="h-3 w-3 text-red-600" />
                      ) : (
                        <ShieldCheck className="h-3 w-3 text-green-600" />
                      )}
                    </span>
                  </button>
                  <span className={`text-sm font-medium ${user.isBanned ? 'text-red-600' : 'text-green-600'}`}>
                    {user.isBanned ? 'Banned' : 'Allowed'}
                  </span>
                </div>
              </div>
              {user.isBanned && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <Ban className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">Account Banned</p>
                      <p className="text-red-700 mt-1">
                        Banned on: {user.bannedAt ? new Date(user.bannedAt).toLocaleDateString() : 'Unknown'}
                      </p>
                      {user.banReason && (
                        <p className="text-red-700 mt-1">
                          Reason: {user.banReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Stats Section */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-blue-600" />
                  Games Played
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.gamesPlayed}</div>
                <CardDescription className="text-xs mt-1">
                  {hostedGames} hosted, {joinedGames} joined
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user.totalRatings > 0 ? user.averageRating.toFixed(1) : "N/A"}
                </div>
                <CardDescription className="text-xs mt-1">
                  {user.totalRatings} {user.totalRatings === 1 ? "rating" : "ratings"}
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  Hosted Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hostedGames}</div>
                <CardDescription className="text-xs mt-1">Games created</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  Joined Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{joinedGames}</div>
                <CardDescription className="text-xs mt-1">Games participated</CardDescription>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Games List Section */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Games ({loadingGames ? "..." : games.length})
            </h4>
            {loadingGames ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p>Loading games...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gamepad2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No games found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {games.map((game) => (
                  <Card key={game.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{game.title}</h5>
                          {game.isHost && (
                            <Badge variant="outline" className="text-xs">
                              Host
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="capitalize">{game.sport}</span>
                          <span>•</span>
                          <span>{new Date(game.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(game.status)}>
                        {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Warning Notification Form */}
      <WarningNotificationForm
        userId={user.id}
        userName={user.name}
        isOpen={showWarningForm}
        onClose={() => setShowWarningForm(false)}
      />

      {/* Ban/Unban User Modal */}
      <BanUserModal
        userId={user.id}
        userName={user.name}
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onUserUpdated={() => {
          if (onUserUpdated) onUserUpdated()
        }}
        isBanned={user.isBanned || false}
        onToggleStart={() => setIsToggling(true)}
        onToggleEnd={() => setIsToggling(false)}
        onSuccess={handleBanSuccess}
      />

      {/* Ban Success Confirmation Modal */}
      <BanSuccessModal
        userName={user.name}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        wasBanned={successBanState}
      />
    </Dialog>
  )
}
