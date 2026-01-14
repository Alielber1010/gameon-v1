"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone, MapPin, Edit2, Save, X, Loader2, Trophy, Calendar, Camera, Star, Trash2, Tag } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DeleteAccountModal } from "@/components/dashboard/delete-account-modal"
import { InterestsSelectorDialog } from "@/components/dashboard/interests-selector-dialog"
import { getSportDisplayName } from "@/lib/constants/sports"

interface UserProfile {
  id: string
  name: string
  email: string
  image: string
  role: string
  bio: string
  phoneNumber: string
  location: string
  interests?: string[]
  createdAt: string
  updatedAt: string
  gamesPlayed?: number
  averageRating?: number
  totalRatings?: number
  stats: {
    gamesHosted: number
    gamesJoined: number
  }
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phoneNumber: "",
    location: "",
    interests: [] as string[],
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showInterestsDialog, setShowInterestsDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/users/profile')
        const data = await response.json()

        if (data.success && data.user) {
          setProfile(data.user)
          setFormData({
            name: data.user.name || "",
            bio: data.user.bio || "",
            phoneNumber: data.user.phoneNumber || "",
            location: data.user.location || "",
            interests: data.user.interests || [],
          })
        } else {
          setError(data.error || 'Failed to load profile')
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setProfile(data.user)
        setIsEditing(false)
        setSuccess('Profile updated successfully!')
        
        // Update session to reflect name/image changes
        await update()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        phoneNumber: profile.phoneNumber || "",
        location: profile.location || "",
        interests: profile.interests || [],
      })
    }
    setNewInterest("")
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  const handleInterestsSave = (interests: string[]) => {
    setFormData({
      ...formData,
      interests,
    })
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    try {
      setIsUploadingImage(true)
      setError(null)

      // Upload image
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/users/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image')
      }

      // Update profile image
      const updateResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: data.imageUrl,
        }),
      })

      const updateData = await updateResponse.json()

      if (!updateResponse.ok || !updateData.success) {
        throw new Error(updateData.error || 'Failed to update profile')
      }

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          image: data.imageUrl,
        })
      }

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.imageUrl,
        },
      })

      setSuccess('Profile picture updated successfully!')
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold text-green-600">Profile</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold text-green-600">Profile</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-green-100 ring-offset-4 ring-offset-white shadow-xl">
                  <Image
                    src={profile.image || '/placeholder.svg'}
                    alt={profile.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    unoptimized={profile.image?.includes('blob.vercel-storage.com') || profile.image?.startsWith('http')}
                    onError={(e) => {
                      // Fallback to placeholder on error
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleImageClick}
                      disabled={isUploadingImage}
                      className="absolute bottom-2 right-2 bg-green-600 text-white rounded-full p-3 hover:bg-green-700 transition-all shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change profile picture"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </button>
                  </>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-600 flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
                {profile.role === 'admin' && (
                  <span className="inline-block mt-2 px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Profile Information</CardTitle>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Your name"
                  className="h-11"
                />
              ) : (
                <p className="text-gray-900 text-lg py-2">{profile.name}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                Email Address
              </Label>
              <p className="text-gray-900 text-lg py-2">{profile.email}</p>
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[120px] resize-none"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap py-2 leading-relaxed">
                  {profile.bio || <span className="text-gray-400 italic">No bio yet. Add one to let others know more about you!</span>}
                </p>
              )}
            </div>

            {/* Phone Number & Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="+1234567890"
                    className="h-11"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{profile.phoneNumber || <span className="text-gray-400">Not provided</span>}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Location
                </Label>
                {isEditing ? (
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="City, Country"
                    className="h-11"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{profile.location || <span className="text-gray-400">Not provided</span>}</p>
                )}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                Interests
                {isEditing && (
                  <span className="text-xs font-normal text-gray-500 ml-auto">
                    {formData.interests.length}/5
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2 py-2">
                {(isEditing ? formData.interests : (profile.interests || [])).length > 0 ? (
                  (isEditing ? formData.interests : (profile.interests || [])).map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      {getSportDisplayName(interest)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">No interests added yet</span>
                )}
              </div>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInterestsDialog(true)}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {formData.interests.length > 0 ? "Edit Interests" : "Add Interests"}
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isSaving}
                  size="lg"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Interests Selector Dialog */}
      <InterestsSelectorDialog
        isOpen={showInterestsDialog}
        onClose={() => setShowInterestsDialog(false)}
        selectedInterests={formData.interests}
        onSave={handleInterestsSave}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userEmail={profile.email}
      />
    </div>
  )
}
