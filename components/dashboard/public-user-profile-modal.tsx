"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Star, Trophy, Calendar, Loader2 } from "lucide-react"
import type { UserProfile } from "@/lib/db/models/types/game"
import Image from "next/image"
import { useState, useEffect } from "react"
import { getUserProfile, type PublicUserProfile } from "@/lib/api/users"
import { toast } from "sonner"

interface PublicUserProfileModalProps {
  user: UserProfile
  isOpen: boolean
  onClose: () => void
}

export function PublicUserProfileModal({ user, isOpen, onClose }: PublicUserProfileModalProps) {
  const [profileData, setProfileData] = useState<PublicUserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && user.id) {
      fetchUserProfile()
    }
  }, [isOpen, user.id])

  const fetchUserProfile = async () => {
    setLoading(true)
    try {
      const response = await getUserProfile(user.id)
      if (response.success && response.data) {
        setProfileData(response.data)
      } else {
        toast.error(response.error || 'Failed to load user profile')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`
    return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'month' : 'months'} ago`
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-600">Player Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : profileData ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-24 h-24">
                <Image
                  src={profileData.image || "/placeholder.svg"}
                  alt={profileData.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold">{profileData.name}</h3>
                {user.age && <p className="text-gray-600">{user.age} years old</p>}
              </div>
            </div>

            {/* Skills and Stats */}
            <div className="space-y-4">
              {user.skillLevel && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Skill Level:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {user.skillLevel}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">Rating:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {profileData.averageRating > 0 ? profileData.averageRating.toFixed(1) : 'N/A'}
                    {profileData.averageRating > 0 && '/5'}
                  </span>
                  {profileData.totalRatings > 0 && (
                    <span className="text-xs text-gray-500">({profileData.totalRatings})</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Games Played:</span>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{profileData.gamesPlayed}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Member Since:</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{profileData.memberSince}</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profileData.bio && (
              <div className="space-y-2">
                <h4 className="font-medium">About</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{profileData.bio}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Failed to load user profile</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
