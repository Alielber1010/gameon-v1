"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { MapPin, Satellite, Map as MapIcon } from "lucide-react"
import { reverseGeocode } from "@/lib/utils/geocoding"
import { useDialog } from "@/lib/utils/dialog"

// Fix for default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

interface MapLocationPickerProps {
  initialPosition?: { lat: number; lng: number }
  onLocationSelect: (location: {
    address: string
    city?: string
    country?: string
    coordinates: { lat: number; lng: number }
  }) => void
  height?: string
}

// Component to handle map click events
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (location: {
    address: string
    city?: string
    country?: string
    coordinates: { lat: number; lng: number }
  }) => void
}) {
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng
      setIsReverseGeocoding(true)
      try {
        const result = await reverseGeocode(lat, lng)
        if (result) {
          onLocationSelect({
            address: result.address,
            city: result.city,
            country: result.country,
            coordinates: { lat, lng },
          })
        } else {
          // Fallback if reverse geocoding fails
          onLocationSelect({
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            coordinates: { lat, lng },
          })
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error)
        onLocationSelect({
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          coordinates: { lat, lng },
        })
      } finally {
        setIsReverseGeocoding(false)
      }
    },
  })

  return null
}

// Component to handle marker drag
function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: { lat: number; lng: number }
  onDragEnd: (lat: number, lng: number) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = {
    dragstart: () => {
      setIsDragging(true)
    },
    dragend: async () => {
      setIsDragging(false)
      const marker = markerRef.current
      if (marker != null) {
        const { lat, lng } = marker.getLatLng()
        setIsReverseGeocoding(true)
        try {
          const result = await reverseGeocode(lat, lng)
          if (result) {
            onDragEnd(lat, lng)
          } else {
            onDragEnd(lat, lng)
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error)
          onDragEnd(lat, lng)
        } finally {
          setIsReverseGeocoding(false)
        }
      }
    },
  }

  return (
    <Marker
      position={position}
      draggable={true}
      ref={markerRef}
      eventHandlers={eventHandlers}
      icon={
        isDragging || isReverseGeocoding
          ? L.icon({
              iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
            })
          : undefined
      }
    />
  )
}

// Component to change map view
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

export function MapLocationPicker({
  initialPosition,
  onLocationSelect,
  height = "400px",
}: MapLocationPickerProps) {
  const { alert } = useDialog()
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lng: number }>(
    initialPosition || { lat: 3.1390, lng: 101.6869 } // Default to Kuala Lumpur, Malaysia
  )
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  // Only render map on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update position when initialPosition changes
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition)
    }
  }, [initialPosition])

  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    setPosition({ lat, lng })
    setIsReverseGeocoding(true)
    try {
      const result = await reverseGeocode(lat, lng)
      if (result) {
        onLocationSelect({
          address: result.address,
          city: result.city,
          country: result.country,
          coordinates: { lat, lng },
        })
      } else {
        onLocationSelect({
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          coordinates: { lat, lng },
        })
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      onLocationSelect({
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        coordinates: { lat, lng },
      })
    } finally {
      setIsReverseGeocoding(false)
    }
  }

  const handleMapClick = async (location: {
    address: string
    city?: string
    country?: string
    coordinates: { lat: number; lng: number }
  }) => {
    setPosition(location.coordinates)
    onLocationSelect(location)
  }

  // Get user's current location
  const handleGetCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setPosition({ lat: latitude, lng: longitude })
          handleMarkerDragEnd(latitude, longitude)
        },
        async (error) => {
          console.error("Error getting location:", error)
          await alert("Location Error: Unable to get your location. Please allow location access or search for a location.")
        }
      )
    } else {
      await alert("Location Unavailable: Geolocation is not supported by your browser.")
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Select Location on Map</span>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden flex items-center justify-center" style={{ height }}>
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Select Location on Map</span>
          {isReverseGeocoding && (
            <span className="text-xs text-gray-500">Getting address...</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            className="text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            My Location
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
            className="text-xs"
          >
            {mapType === "street" ? (
              <>
                <Satellite className="h-3 w-3 mr-1" />
                Satellite
              </>
            ) : (
              <>
                <MapIcon className="h-3 w-3 mr-1" />
                Street
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <ChangeView center={[position.lat, position.lng]} zoom={15} />
          
          {mapType === "street" ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}

          <DraggableMarker position={position} onDragEnd={handleMarkerDragEnd} />
          <MapClickHandler onLocationSelect={handleMapClick} />
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500">
        💡 Click on the map or drag the marker to select the exact location of the sport court
      </p>
    </div>
  )
}

