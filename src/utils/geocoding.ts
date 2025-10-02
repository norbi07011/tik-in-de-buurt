/**
 * 🗺️ Address Geocoding Utilities
 * 
 * Utilities for converting addresses to coordinates for Street View and mapping
 */

interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Cache for geocoded addresses to avoid repeated API calls
const geocodeCache = new Map<string, Coordinates>();

/**
 * Convert address to coordinates using multiple methods
 */
export const geocodeAddress = async (address: Address | string): Promise<Coordinates | null> => {
  const addressString = typeof address === 'string' 
    ? address 
    : `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;

  // Check cache first
  if (geocodeCache.has(addressString)) {
    return geocodeCache.get(addressString)!;
  }

  try {
    // Method 1: Try backend geocoding service first
    const backendResult = await geocodeWithBackend(addressString);
    if (backendResult) {
      geocodeCache.set(addressString, backendResult);
      return backendResult;
    }

    // Method 2: Try browser geolocation service
    const browserResult = await geocodeWithBrowser(addressString);
    if (browserResult) {
      geocodeCache.set(addressString, browserResult);
      return browserResult;
    }

    // Method 3: Fallback to approximate coordinates for known cities
    const fallbackResult = getFallbackCoordinates(address);
    if (fallbackResult) {
      geocodeCache.set(addressString, fallbackResult);
      return fallbackResult;
    }

    return null;
  } catch (error) {
    console.error('🗺️ Geocoding failed:', error);
    return null;
  }
};

/**
 * Geocode using backend service
 */
const geocodeWithBackend = async (address: string): Promise<Coordinates | null> => {
  try {
    const API_BASE_URL = (window as any).VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const response = await fetch(`${API_BASE_URL}/api/locations/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.result?.coordinates) {
        return {
          lat: data.result.coordinates.lat,
          lng: data.result.coordinates.lng
        };
      }
    }
  } catch (error) {
    console.warn('🗺️ Backend geocoding failed:', error);
  }
  return null;
};

/**
 * Geocode using browser's Google Maps API (if available)
 */
const geocodeWithBrowser = async (address: string): Promise<Coordinates | null> => {
  try {
    // Check if Google Maps is available
    if (!(window as any).google?.maps?.Geocoder) {
      return null;
    }

    const geocoder = new (window as any).google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === (window as any).google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.warn('🗺️ Browser geocoding failed:', error);
    return null;
  }
};

/**
 * Fallback coordinates for major cities in the Netherlands and other countries
 */
const getFallbackCoordinates = (address: Address | string): Coordinates | null => {
  const cityCoordinates: Record<string, Coordinates> = {
    // Netherlands - Major Cities
    'amsterdam': { lat: 52.3676, lng: 4.9041 },
    'rotterdam': { lat: 51.9244, lng: 4.4777 },
    'den haag': { lat: 52.0705, lng: 4.3007 },
    'the hague': { lat: 52.0705, lng: 4.3007 },
    'utrecht': { lat: 52.0907, lng: 5.1214 },
    'eindhoven': { lat: 51.4416, lng: 5.4697 },
    'tilburg': { lat: 51.5555, lng: 5.0913 },
    'groningen': { lat: 53.2194, lng: 6.5665 },
    'almere': { lat: 52.3508, lng: 5.2647 },
    'breda': { lat: 51.5719, lng: 4.7683 },
    'nijmegen': { lat: 51.8426, lng: 5.8527 },
    'enschede': { lat: 52.2215, lng: 6.8937 },
    'apeldoorn': { lat: 52.2112, lng: 5.9699 },
    'haarlem': { lat: 52.3874, lng: 4.6462 },
    'amersfoort': { lat: 52.1518, lng: 5.3878 },
    'zaanstad': { lat: 52.4389, lng: 4.8289 },
    'haarlemmermeer': { lat: 52.3105, lng: 4.6913 },
    'zwolle': { lat: 52.5168, lng: 6.0830 },
    'zoetermeer': { lat: 52.0575, lng: 4.4937 },
    'leiden': { lat: 52.1601, lng: 4.4970 },
    
    // Belgium
    'brussels': { lat: 50.8503, lng: 4.3517 },
    'antwerp': { lat: 51.2194, lng: 4.4025 },
    'ghent': { lat: 51.0543, lng: 3.7174 },
    'bruges': { lat: 51.2093, lng: 3.2247 },
    
    // Germany
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'hamburg': { lat: 53.5511, lng: 9.9937 },
    'munich': { lat: 48.1351, lng: 11.5820 },
    'cologne': { lat: 50.9375, lng: 6.9603 },
    
    // France
    'paris': { lat: 48.8566, lng: 2.3522 },
    'lyon': { lat: 45.7640, lng: 4.8357 },
    'marseille': { lat: 43.2965, lng: 5.3698 },
    
    // UK
    'london': { lat: 51.5074, lng: -0.1278 },
    'manchester': { lat: 53.4808, lng: -2.2426 },
    'birmingham': { lat: 52.4862, lng: -1.8904 },
  };

  let cityName: string;
  
  if (typeof address === 'string') {
    // Extract city from address string
    const parts = address.toLowerCase().split(',');
    cityName = parts.find(part => 
      Object.keys(cityCoordinates).some(city => 
        part.trim().includes(city)
      )
    )?.trim() || '';
  } else {
    cityName = address.city.toLowerCase();
  }

  // Find matching city
  const matchingCity = Object.keys(cityCoordinates).find(city => 
    cityName.includes(city) || city.includes(cityName)
  );

  return matchingCity ? cityCoordinates[matchingCity] : null;
};

/**
 * Generate a Google Maps URL for the address
 */
export const getGoogleMapsUrl = (address: Address | string): string => {
  const addressString = typeof address === 'string' 
    ? address 
    : `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
  
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
};

/**
 * Check if Street View is likely available for a location
 */
export const isStreetViewLikelyAvailable = (address: Address | string): boolean => {
  const addressString = typeof address === 'string' ? address.toLowerCase() : address.city.toLowerCase();
  
  // Street View is widely available in these countries
  const supportedRegions = [
    'netherlands', 'nederland', 'belgium', 'belgië', 'germany', 'deutschland',
    'france', 'united kingdom', 'uk', 'spain', 'italy', 'portugal',
    'denmark', 'sweden', 'norway', 'finland', 'austria', 'switzerland',
    'czech republic', 'poland', 'hungary', 'slovenia', 'slovakia'
  ];
  
  // Major cities with good Street View coverage
  const supportedCities = [
    'amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven',
    'brussels', 'antwerp', 'berlin', 'hamburg', 'paris', 'london'
  ];
  
  return supportedRegions.some(region => addressString.includes(region)) ||
         supportedCities.some(city => addressString.includes(city));
};

export default geocodeAddress;