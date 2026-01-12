/**
 * Utility functions for handling location display
 */

/**
 * Checks if a string is a Google Maps URL
 */
export function isGoogleMapsLink(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  const googleMapsPatterns = [
    'google.com/maps',
    'maps.google.com',
    'goo.gl/maps',
    'maps.app.goo.gl',
  ]
  
  const lowerUrl = url.toLowerCase().trim()
  return googleMapsPatterns.some(pattern => lowerUrl.includes(pattern))
}

/**
 * Extracts location name from Google Maps URL
 */
function extractLocationNameFromGoogleMapsUrl(url: string): string {
  try {
    if (!url || typeof url !== 'string') {
      return 'View on Google Maps'
    }

    // Try to decode the URL, but handle errors if it's already decoded
    let decodedUrl = url
    try {
      decodedUrl = decodeURIComponent(url)
    } catch (e) {
      // URL might already be decoded, use as-is
      decodedUrl = url
    }

    // Try to extract from /place/... format
    // Example: https://www.google.com/maps/place/Everyday+Sports/@1.123,103.456
    // Example: https://www.google.com/maps/place/Everyday+Sports,+Johor,+Malaysia/@1.123,103.456
    const placeMatch = decodedUrl.match(/\/place\/([^/@]+)/)
    if (placeMatch && placeMatch[1]) {
      let placeName = placeMatch[1]
        .replace(/\+/g, ' ')
        .replace(/%20/g, ' ')
        .replace(/%2C/g, ',')
        .replace(/%2F/g, '/')
        .trim()
      
      // Clean up common URL encoding artifacts
      placeName = placeName.split('/')[0] // Take only the first part before any slash
      placeName = placeName.split('?')[0] // Remove query parameters
      
      if (placeName && placeName.length > 0 && !placeName.match(/^[\d\s,.-]+$/)) {
        // Make sure it's not just coordinates
        return placeName
      }
    }

    // Try to extract from ?q=... format
    // Example: https://maps.google.com/?q=Everyday+Sports,+Johor,+Malaysia
    // Example: https://www.google.com/maps?q=Everyday+Sports,+Johor,+Malaysia
    const qMatch = decodedUrl.match(/[?&]q=([^&]+)/)
    if (qMatch && qMatch[1]) {
      let locationName = qMatch[1]
        .replace(/\+/g, ' ')
        .replace(/%20/g, ' ')
        .replace(/%2C/g, ',')
        .trim()
      
      // Check if it's just coordinates (format: lat,lng)
      const coordMatch = locationName.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
      if (!coordMatch && locationName.length > 0) {
        return locationName
      }
    }

    // Try to extract from data parameter
    const dataMatch = decodedUrl.match(/[?&]data=([^&]+)/)
    if (dataMatch && dataMatch[1]) {
      let locationName = dataMatch[1]
        .replace(/\+/g, ' ')
        .replace(/%20/g, ' ')
        .replace(/%2C/g, ',')
        .trim()
      
      if (locationName && locationName.length > 0) {
        return locationName
      }
    }

    // If we can't extract, return a default
    return 'View on Google Maps'
  } catch (error) {
    console.error('Error extracting location name from URL:', error, url)
    return 'View on Google Maps'
  }
}

/**
 * Formats location for display - if it's a Google Maps link, returns a clickable link
 */
export function formatLocationForDisplay(location: string | { address?: string; city?: string; country?: string } | undefined): {
  text: string
  isLink: boolean
  url?: string
} {
  if (!location) {
    return { text: 'Location not specified', isLink: false }
  }
  
  // If location is a string
  if (typeof location === 'string') {
    if (isGoogleMapsLink(location)) {
      const locationName = extractLocationNameFromGoogleMapsUrl(location)
      // Only return extracted name if it's not the default fallback
      if (locationName !== 'View on Google Maps') {
        return { text: locationName, isLink: true, url: location }
      }
      // If extraction failed, try to construct from city/country if available
      return { text: locationName, isLink: true, url: location }
    }
    return { text: location, isLink: false }
  }
  
  // If location is an object with address
  if (location.address) {
    if (isGoogleMapsLink(location.address)) {
      const locationName = extractLocationNameFromGoogleMapsUrl(location.address)
      // Only return extracted name if it's not the default fallback
      if (locationName !== 'View on Google Maps') {
        return { text: locationName, isLink: true, url: location.address }
      }
      // If extraction failed but we have city/country, construct a readable name
      if (location.city || location.country) {
        const parts = [location.city, location.country].filter(Boolean)
        if (parts.length > 0) {
          return { text: parts.join(', '), isLink: true, url: location.address }
        }
      }
      // Fallback to extracted name (which might be "View on Google Maps")
      return { text: locationName, isLink: true, url: location.address }
    }
    // Not a Google Maps link, just return the address
    return { text: location.address, isLink: false }
  }
  
  // If we have city/country but no address, construct a readable name
  if (location.city || location.country) {
    const parts = [location.city, location.country].filter(Boolean)
    if (parts.length > 0) {
      return { text: parts.join(', '), isLink: false }
    }
  }
  
  return { text: 'Location not specified', isLink: false }
}



