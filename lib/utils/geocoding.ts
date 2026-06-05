/**
 * Geocoding utilities for converting addresses to coordinates
 * Uses OpenStreetMap Nominatim (free, no API key required)
 */

export interface GeocodeResult {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  formattedAddress?: string;
}

export interface LocationSuggestion {
  displayName: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type?: string;
}

const NOMINATIM_HEADERS = { 'User-Agent': 'GameOn App' }

/** Extract the best city-level name from a Nominatim address object */
function extractCity(address: any): string | undefined {
  if (!address) return undefined
  // city > county (district, e.g. "Johor Bahru") > town (township, e.g. "Iskandar Puteri")
  // Using county before town ensures we get the major city name in Malaysia,
  // since OSM often stores the city district in county rather than city.
  return (
    address.city ||
    address.county ||
    address.town ||
    address.village ||
    address.municipality ||
    address.state_district ||
    address.state
  )
}

function parseNominatimItem(item: any): LocationSuggestion | null {
  const lat = parseFloat(item.lat)
  const lng = parseFloat(item.lon)
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return {
    displayName: item.display_name,
    address: item.display_name,
    city: extractCity(item.address),
    state: item.address?.state,
    country: item.address?.country,
    coordinates: { lat, lng },
    type: item.type,
  }
}

/**
 * Geocode an address to get coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
    const response = await fetch(url, { headers: NOMINATIM_HEADERS })
    if (!response.ok) return null

    const data = await response.json()
    if (!data || data.length === 0) return null

    const result = data[0]
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    if (isNaN(lat) || isNaN(lng)) return null

    return {
      address: result.display_name || address,
      city: extractCity(result.address),
      state: result.address?.state,
      country: result.address?.country,
      coordinates: { lat, lng },
      formattedAddress: result.display_name,
    }
  } catch {
    return null
  }
}

/**
 * Search for location suggestions (autocomplete).
 * Prioritises Malaysia results — tries Malaysia-only first, falls back to global if fewer than 2 hits.
 */
export async function searchLocations(query: string, limit: number = 5): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) return []

  try {
    const base = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}`
    const encoded = encodeURIComponent(query)

    // First: Malaysia-only search
    const myResponse = await fetch(`${base}&countrycodes=my&q=${encoded}`, { headers: NOMINATIM_HEADERS })
    const myData = myResponse.ok ? await myResponse.json() : []
    const myResults = (Array.isArray(myData) ? myData : []).map(parseNominatimItem).filter(Boolean) as LocationSuggestion[]

    if (myResults.length >= 2) return myResults

    // Fallback: global search — append to Malaysia results without duplicates
    const globalResponse = await fetch(`${base}&q=${encoded}`, { headers: NOMINATIM_HEADERS })
    const globalData = globalResponse.ok ? await globalResponse.json() : []
    const globalResults = (Array.isArray(globalData) ? globalData : [])
      .map(parseNominatimItem)
      .filter(Boolean) as LocationSuggestion[]

    const seen = new Set(myResults.map(r => r.displayName))
    const combined = [...myResults]
    for (const r of globalResults) {
      if (!seen.has(r.displayName)) combined.push(r)
      if (combined.length >= limit) break
    }
    return combined
  } catch {
    return []
  }
}

/**
 * Reverse geocode coordinates to get address/city
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    const response = await fetch(url, { headers: NOMINATIM_HEADERS })
    if (!response.ok) return null

    const data = await response.json()
    if (!data || !data.address) return null

    return {
      address: data.display_name || '',
      city: extractCity(data.address),
      state: data.address?.state,
      country: data.address?.country,
      coordinates: { lat, lng },
      formattedAddress: data.display_name,
    }
  } catch {
    return null
  }
}
