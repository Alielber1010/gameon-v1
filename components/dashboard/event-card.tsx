"use client"

import { MapPin } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export interface SportsEvent {
  id?: string
  title: string
  description: string
  city: string
  location: string
  website?: string
  image?: string
}

interface EventCardProps {
  event: SportsEvent
  onClick: () => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  const [imageError, setImageError] = useState(false)
  
  // Parse and validate image URL
  const getImageUrl = () => {
    if (!event.image || imageError) {
      return "/images/eventimage.png"
    }
    
    // If it's already a full URL, use it
    if (event.image.startsWith('http://') || event.image.startsWith('https://')) {
      return event.image
    }
    
    // If it's a relative path, use it
    if (event.image.startsWith('/')) {
      return event.image
    }
    
    // Otherwise, treat as relative path
    return `/${event.image}`
  }

  const imageUrl = getImageUrl()

  return (
    <article 
      className="cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden bg-gray-200">
        <Image
          src={imageUrl}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
          unoptimized={imageUrl.startsWith('http')} // Allow external images
        />
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-lg group-hover:text-green-600 transition-colors">
          {event.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {event.description}
        </p>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{event.city} • {event.location}</span>
        </div>
      </div>
    </article>
  )
}

