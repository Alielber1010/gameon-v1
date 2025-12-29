"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Star, Trophy, Calendar, MapPin } from "lucide-react"
import type { UserProfile } from "@/types/game"
import Image from "next/image"

interface PublicUserProfileModalProps {
  user: UserProfile
  isOpen: boolean
  onClose: () => void
}

export function PublicUserProfileModal({ user, isOpen, onClose }: PublicUserProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-600">Player Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-24 h-24">
              <Image
                src={user.image || "/placeholder.svg"}
                alt={user.name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
              />
            </div>

            <div>
              <h3 className="text-2xl font-bold">{user.name}</h3>
              <p className="text-gray-600">{user.age} years old</p>
            </div>
          </div>

          {/* Skills and Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Skill Level:</span>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                {user.skillLevel}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{user.rating}/5</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Games Played:</span>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-green-600" />
                <span className="font-medium">{user.gamesPlayed}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Member Since:</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Jan 2024</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Location:</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Johor Bahru</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="space-y-2">
              <h4 className="font-medium">About</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{user.bio}</p>
            </div>
          )}

          {/* Recent Activity */}
          <div className="space-y-2">
            <h4 className="font-medium">Recent Activity</h4>
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="text-sm">
                <span className="text-green-600 font-medium">✓</span> Completed Basketball game - 2 days ago
              </div>
              <div className="text-sm">
                <span className="text-green-600 font-medium">✓</span> Joined Football match - 1 week ago
              </div>
              <div className="text-sm">
                <span className="text-green-600 font-medium">✓</span> Hosted Tennis game - 2 weeks ago
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="text-center text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Contact information is only available to game hosts
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
