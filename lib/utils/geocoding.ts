/**
 * Geocoding utilities for converting addresses to coordinates
 * Uses OpenStreetMap Nominatim (free, no API key required)
 */

export interface GeocodeResult {
  address: string;
  city?: string;
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
  coordinates: {
    lat: number;
    lng: number;
  };
  type?: string; // e.g., "place", "amenity", "building"
}

/**
 * Geocode an address to get coordinates
 * Uses OpenStreetMap Nominatim API (free, no key required)
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key needed)
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GameOn App', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log('No geocoding results found for:', address);
      return null;
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Invalid coordinates:', { lat, lng });
      return null;
    }

    // Extract city from address components
    const city = result.address?.city || 
                 result.address?.town || 
                 result.address?.village ||
                 result.address?.municipality ||
                 result.address?.county;

    return {
      address: result.display_name || address,
      city: city,
      coordinates: {
        lat,
        lng,
      },
      formattedAddress: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Search for location suggestions (autocomplete)
 * Returns multiple results matching the query
 */
export async function searchLocations(query: string, limit: number = 5): Promise<LocationSuggestion[]> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    // Use OpenStreetMap Nominatim search API
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=${limit}&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GameOn App',
      },
    });

    if (!response.ok) {
      console.error('Location search API error:', response.statusText);
      return [];
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Transform results to our format
    return data.map((item: any) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
      }

      const city = item.address?.city || 
                   item.address?.town || 
                   item.address?.village ||
                   item.address?.municipality ||
                   item.address?.county ||
                   item.address?.state;

      return {
        displayName: item.display_name,
        address: item.display_name,
        city: city,
        coordinates: {
          lat,
          lng,
        },
        type: item.type,
      };
    }).filter((item: LocationSuggestion | null) => item !== null) as LocationSuggestion[];
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GameOn App',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data || !data.address) {
      return null;
    }

    const city = data.address.city || 
                 data.address.town || 
                 data.address.village ||
                 data.address.municipality;
    
    const country = data.address.country;

    return {
      address: data.display_name || '',
      city: city,
      country: country,
      coordinates: { lat, lng },
      formattedAddress: data.display_name,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

