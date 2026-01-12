/**
 * Utility functions for extracting data from Google Maps links
 */

export interface GoogleMapsLinkData {
  coordinates: { lat: number; lng: number }
  address?: string
  isValid: boolean
}

/**
 * Validates if a URL is from Google Maps
 */
export function isValidGoogleMapsLink(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const googleMapsDomains = [
    'google.com/maps',
    'maps.google.com',
    'goo.gl/maps',
    'maps.app.goo.gl',
  ]

  const lowerUrl = url.toLowerCase().trim()
  return googleMapsDomains.some(domain => lowerUrl.includes(domain))
}

/**
 * Extracts coordinates from various Google Maps URL formats
 * Supports:
 * - https://www.google.com/maps?q=lat,lng
 * - https://www.google.com/maps/@lat,lng,zoom
 * - https://www.google.com/maps/place/.../@lat,lng,zoom
 * - https://maps.google.com/?q=lat,lng
 * - Shortened URLs (goo.gl/maps, maps.app.goo.gl) - will need to follow redirect
 */
export async function extractCoordinatesFromGoogleMapsLink(url: string): Promise<GoogleMapsLinkData | null> {
  if (!isValidGoogleMapsLink(url)) {
    return null
  }

  try {
    // Clean the URL
    let cleanUrl = url.trim()
    
    // Handle shortened URLs by resolving them via API
    if (cleanUrl.includes('goo.gl/maps') || cleanUrl.includes('maps.app.goo.gl')) {
      try {
        const response = await fetch('/api/geocode/google-maps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: cleanUrl }),
        })

        const data = await response.json()
        if (data.success && data.data?.resolvedUrl) {
          cleanUrl = data.data.resolvedUrl
        } else {
          return null
        }
      } catch (error) {
        console.error('Error resolving shortened URL:', error)
        return null
      }
    }

    // Extract coordinates from @lat,lng,zoom format
    const atMatch = cleanUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) {
      const lat = parseFloat(atMatch[1])
      const lng = parseFloat(atMatch[2])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          coordinates: { lat, lng },
          isValid: true,
        }
      }
    }

    // Extract coordinates from ?q=lat,lng format
    const qMatch = cleanUrl.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (qMatch) {
      const lat = parseFloat(qMatch[1])
      const lng = parseFloat(qMatch[2])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          coordinates: { lat, lng },
          isValid: true,
        }
      }
    }

    // Extract coordinates from /place/.../@lat,lng format
    const placeMatch = cleanUrl.match(/\/place\/[^@]+@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1])
      const lng = parseFloat(placeMatch[2])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          coordinates: { lat, lng },
          isValid: true,
        }
      }
    }

    // Try to extract from data parameter
    const dataMatch = cleanUrl.match(/data=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (dataMatch) {
      const lat = parseFloat(dataMatch[1])
      const lng = parseFloat(dataMatch[2])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          coordinates: { lat, lng },
          isValid: true,
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting coordinates from Google Maps link:', error)
    return null
  }
}

/**
 * Gets the shareable Google Maps link format
 * This is the format users should use: https://www.google.com/maps?q=lat,lng
 */
export function createGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

