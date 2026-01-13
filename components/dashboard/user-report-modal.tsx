"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ImageIcon, X, Loader2 } from "lucide-react"
import type { Game, UserProfile } from "@/lib/db/models/types/game"
import { toast } from "sonner"

interface UserReportModalProps {
  user: UserProfile
  game: Game
  isOpen: boolean
  onClose: () => void
}

export function UserReportModal({ user, game, isOpen, onClose }: UserReportModalProps) {
  const [reportType, setReportType] = useState("")
  const [description, setDescription] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (selectedImages.length + files.length > 3) {
      setError('Maximum 3 images allowed')
      return
    }

    // Validate file types and sizes
    const validFiles: File[] = []
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select image files only')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      validFiles.push(file)
    })

    if (validFiles.length === 0) return

    setSelectedImages((prev) => [...prev, ...validFiles])
    setError(null)

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/reports/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const data = await response.json()
    return data.imageUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!reportType || !description.trim()) {
        setError('Please select a report type and provide a description')
        setIsLoading(false)
        return
      }

      // Upload images if any
      const imageUrls: string[] = []
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          try {
            const imageUrl = await uploadImage(image)
            imageUrls.push(imageUrl)
          } catch (err: any) {
            setError(err.message || 'Failed to upload one or more images')
            setIsLoading(false)
            return
          }
        }
      }

      // Submit report
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: game.id,
          userId: user.id,
          reportType,
          description: description.trim(),
          images: imageUrls,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to submit report')
        setIsLoading(false)
        return
      }

      // Reset form and close
      setReportType("")
      setDescription("")
      setSelectedImages([])
      setImagePreviews([])
      setUploadedImageUrls([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast.success('Report submitted successfully')
      onClose()
    } catch (err: any) {
      console.error('Error submitting report:', err)
      setError(err.message || 'Failed to submit report')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-600">
            Report {user.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Report Type *</Label>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam">Spam</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment">Harassment or Bullying</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate">Inappropriate Content</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fake_scam" id="fake_scam" />
                <Label htmlFor="fake_scam">Fake or Scam</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="violence" id="violence" />
                <Label htmlFor="violence">Violence or Threats</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell Us Why"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Screenshot Proof (Optional, 1-3 images)</Label>
            <div className="space-y-3">
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imagePreviews.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
                >
                  <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload screenshot ({imagePreviews.length}/3)
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WebP up to 5MB each
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500">
              Upload 1-3 screenshots as proof of your report
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!reportType || !description.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
