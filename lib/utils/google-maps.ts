/**
 * Utility functions for extracting data from Google Maps links
 * Based on Google's canonical URL patterns and validation
 */

export interface GoogleMapsLinkData {
  coordinates?: { lat: number; lng: number }
  address?: string
  city?: string
  country?: string
  isValid: boolean
  error?: string
  resolvedUrl?: string
}

/**
 * Stage 1: Validates if a URL is a shortened Google Maps link
 * (Used before resolution)
 */
export function isValidGoogleMapsLink(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const googleMapsDomains = [
    'google.com/maps',
    'maps.google.com',
    'goo.gl/maps',
    'maps.app.goo.gl', // Google Maps mobile app short links
  ]

  const lowerUrl = url.toLowerCase().trim()
  
  // Check if it's a Google Maps domain
  const isGoogleMaps = googleMapsDomains.some(domain => lowerUrl.includes(domain))
  
  // Also check for the full URL pattern with protocol
  if (!isGoogleMaps && (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://'))) {
    // Remove protocol and check again
    const urlWithoutProtocol = lowerUrl.replace(/^https?:\/\//, '')
    return googleMapsDomains.some(domain => urlWithoutProtocol.includes(domain))
  }
  
  return isGoogleMaps
}

/**
 * Stage 2: Validates a canonical Google Maps URL
 * A link is considered a real Google Maps location if ANY of these exist:
 * - /maps/place/ (real POI)
 * - /maps/search/ (real location search)
 * - /maps/@lat,lng (raw coordinate pin)
 * - ?q=lat,lng (raw coordinate query)
 * - !3dLAT!4dLNG (encoded coordinates)
 * - place_id= (official POI identity)
 */
export function isValidCanonicalGoogleMapsUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const urlObj = new URL(url)
    
    // Must be from google.com domain
    if (!urlObj.hostname.endsWith('google.com')) {
      return false
    }

    const path = urlObj.pathname
    const fullUrl = urlObj.toString()

    // Check for valid Google Maps patterns
    const patterns = [
      /\/maps\/place\//,                    // Real POI
      /\/maps\/search\//,                   // Real location search
      /\/maps\/@-?\d+\.\d+,-?\d+\.\d+/,     // Raw coordinate pin
      /[?&]q=-?\d+\.\d+,-?\d+\.\d+/,        // Raw coordinate query
      /!3d-?\d+\.\d+!4d-?\d+\.\d+/,         // Encoded coordinates
      /[?&]place_id=/,                      // Official POI identity
    ]

    return patterns.some(pattern => pattern.test(fullUrl))
  } catch {
    return false
  }
}

/**
 * Stage 3: Extract coordinates from canonical Google Maps URL
 */
function extractCoordinates(url: string): { lat: number; lng: number } | null {
  // Pattern 1: /maps/@lat,lng,
  const atMatch = url.match(/\/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) {
    const lat = parseFloat(atMatch[1])
    const lng = parseFloat(atMatch[2])
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }

  // Pattern 2: !3dLAT!4dLNG
  const dataLatLngMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (dataLatLngMatch) {
    const lat = parseFloat(dataLatLngMatch[1])
    const lng = parseFloat(dataLatLngMatch[2])
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }

  // Pattern 3: ?q=lat,lng
  try {
    const urlObj = new URL(url)
    const qParam = urlObj.searchParams.get('q')
    if (qParam && qParam.includes(',')) {
      const [latStr, lngStr] = qParam.split(',')
      const lat = parseFloat(latStr.trim())
      const lng = parseFloat(lngStr.trim())
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng }
      }
    }
  } catch {
    // URL parsing failed, continue
  }

  return null
}

/**
 * Get country from city name using geocoding
 */
async function getCountryFromCity(city: string): Promise<string | null> {
  try {
    // Use OpenStreetMap Nominatim to get country from city name
    const encodedCity = encodeURIComponent(city)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedCity}&limit=1&addressdetails=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GameOn App',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data && data.length > 0 && data[0].address) {
      return data[0].address.country || null
    }

    return null
  } catch (error) {
    console.error('Error getting country from city:', error)
    return null
  }
}

/**
 * Stage 4: Extract city and country from canonical Google Maps URL
 * For mobile links: Extract from ?q= parameter (e.g., ?q=Place,+City)
 * Last part is the city, then identify country from city name
 */
async function extractCityCountry(url: string): Promise<{ city: string | null; country: string | null }> {
  try {
    const decoded = decodeURIComponent(url)
    
    // Method 1: Extract from ?q= parameter (mobile links format)
    // Example: ?q=Footballhub+Central,+Lot+58824,+Jalan+BP+7/16,+Bandar+Bukit+Puchong,+47100+Puchong,+Selangor
    // Last part (Selangor) is the city
    try {
      const urlObj = new URL(url)
      const qParam = urlObj.searchParams.get('q')
      
      if (qParam) {
        // Split by comma and clean up
        const addressParts = qParam
          .split(',')
          .map(p => p.trim().replace(/\+/g, ' '))
          .filter(p => p && p.length > 0)
        
        if (addressParts.length >= 1) {
          // Last part is the city
          const city = addressParts[addressParts.length - 1].trim()
          
          // Validate: should be alphabetic (with spaces) and reasonable length
          if (/^[A-Za-z\s]+$/.test(city) && city.length > 2) {
            // Get country from city name using geocoding
            const country = await getCountryFromCity(city)
            return { city, country }
          }
        }
      }
    } catch {
      // URL parsing failed, try path method
    }
    
    // Method 2: Extract from /maps/place/ path (web links format)
    const parts = decoded.split('/maps/place/')
    if (parts.length >= 2) {
      // Get everything after /maps/place/ and split by /
      const placeParts = parts[parts.length - 1].split('/')
      
      // Remove junk: parts that are empty or start with "@"
      const filteredParts = placeParts
        .map(p => p.replace(/\+/g, ' ').trim())
        .filter(p => p && !p.startsWith('@'))

      let city: string | null = null

      // Find city (last valid alphabetic part)
      for (let i = filteredParts.length - 1; i >= 0; i--) {
        const part = filteredParts[i]
        const cleanedPart = part.replace(/\+/g, ' ')
        
        // City: isalpha and len > 2
        if (/^[A-Za-z\s]+$/.test(cleanedPart) && cleanedPart.replace(/\s/g, '').length > 2) {
          city = cleanedPart
          break
        }
      }

      if (city) {
        // Get country from city name using geocoding
        const country = await getCountryFromCity(city)
        return { city, country }
      }
    }

    return { city: null, country: null }
  } catch (error) {
    console.error('Error extracting city/country from URL:', error)
    return { city: null, country: null }
  }
}

/**
 * Main function: Extracts all data from Google Maps link
 * Handles both shortened and canonical URLs
 */
export async function extractCoordinatesFromGoogleMapsLink(url: string): Promise<GoogleMapsLinkData | null> {
  if (!isValidGoogleMapsLink(url)) {
    return {
      isValid: false,
      error: 'Invalid Google Maps link format',
    }
  }

  try {
    let cleanUrl = url.trim()
    let resolvedUrl: string | undefined = undefined
    
    // Step 1: Resolve shortened URLs to canonical
    if (cleanUrl.includes('goo.gl/maps') || cleanUrl.includes('maps.app.goo.gl')) {
      try {
        const response = await fetch('/api/geocode/google-maps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: cleanUrl }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          return {
            isValid: false,
            error: errorData.error || 'Failed to resolve the shortened Google Maps link. Please try again.',
          }
        }

        const data = await response.json()
        if (data.success && data.data?.resolvedUrl) {
          cleanUrl = data.data.resolvedUrl
          resolvedUrl = data.data.resolvedUrl
          console.log('[Google Maps Extractor] Unwrapped canonical URL:', resolvedUrl)
        } else {
          return {
            isValid: false,
            error: data?.error || 'Could not resolve the Google Maps link. Please try another link.',
          }
        }
      } catch (error) {
        console.error('Error resolving shortened URL:', error)
        return {
          isValid: false,
          error: 'Error resolving the Google Maps link. Please try again.',
        }
      }
    }

    // Step 2: For mobile links, validation is simple: unwrap and extract city/country
    // Detect mobile link by checking if "app" is in the original URL
    const isMobileLink = url.includes('app') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')
    
    if (isMobileLink) {
      // For mobile links: validation = can we extract city and identify country
      const { city, country } = await extractCityCountry(cleanUrl)
      console.log('[Google Maps Extractor] Mobile link - Extracted city:', city, 'country:', country)
      
      if (!city) {
        console.warn('[Google Maps Extractor] Mobile link validation failed - could not extract city')
        return {
          isValid: false,
          error: 'Could not extract city information from this link. Please try sharing the location again.',
          resolvedUrl,
        }
      }
      
      if (!country) {
        console.warn('[Google Maps Extractor] Could not identify country from city:', city)
        // Still valid if we have city, but warn
      }
      
      // Try to extract coordinates (optional for mobile links)
      const coordinates = extractCoordinates(cleanUrl)
      
      return {
        coordinates: coordinates || undefined,
        city,
        country: country || undefined,
        isValid: true,
        resolvedUrl: resolvedUrl || cleanUrl,
      }
    }

    // Step 2: For web links, validate canonical URL (ONLY validate canonical, never the wrapper)
    console.log('[Google Maps Extractor] Validating canonical URL:', cleanUrl)
    if (!isValidCanonicalGoogleMapsUrl(cleanUrl)) {
      console.warn('[Google Maps Extractor] Canonical URL validation failed:', cleanUrl)
      return {
        isValid: false,
        error: 'Invalid Google Maps location. The link does not contain a valid location.',
        resolvedUrl,
      }
    }
    console.log('[Google Maps Extractor] Canonical URL validation passed')

    // Step 3: Extract coordinates
    const coordinates = extractCoordinates(cleanUrl)
    if (!coordinates) {
      console.warn('[Google Maps Extractor] Could not extract coordinates from:', cleanUrl)
      return {
        isValid: false,
        error: 'Could not extract coordinates from this link. Please use a Google Maps link with coordinates.',
        resolvedUrl,
      }
    }
    console.log('[Google Maps Extractor] Extracted coordinates:', coordinates)

    // Step 4: Extract city and country from URL
    const { city, country } = await extractCityCountry(cleanUrl)
    console.log('[Google Maps Extractor] Extracted city:', city, 'country:', country)

    // Step 5: Return all extracted data
    return {
      coordinates,
      city: city || undefined,
      country: country || undefined,
      isValid: true,
      resolvedUrl: resolvedUrl || cleanUrl,
    }
  } catch (error) {
    console.error('Error extracting coordinates from Google Maps link:', error)
    return {
      isValid: false,
      error: 'Error extracting coordinates from the Google Maps link. Please try again.',
    }
  }
}

/**
 * Gets the shareable Google Maps link format
 * This is the format users should use: https://www.google.com/maps?q=lat,lng
 */
export function createGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
