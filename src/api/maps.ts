// 🗺️ Maps API Client
import { API_BASE_URL } from '../constants';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationSearchParams {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  limit?: number;
}

export interface BusinessLocation {
  id: string;
  name: string;
  position: Coordinates;
  address: string;
  distance: number;
  business: {
    id: string;
    name: string;
    category: string;
    rating: number;
    isVerified: boolean;
    phone?: string;
    website?: string;
    isOpen: boolean;
  };
}

export interface GeocodeResult {
  coordinates: Coordinates;
  address: {
    formatted: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  placeId?: string;
  viewport?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

export interface DistanceResult {
  from: Coordinates;
  to: Coordinates;
  distance: number;
  unit: string;
}

export interface CreateLocationData {
  businessId: string;
  address: string | {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  coordinates?: Coordinates;
  name?: string;
  radius?: number;
}

export class MapsAPI {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/locations`;
    this.token = localStorage.getItem('token');
  }

  private getHeaders(requireAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requireAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    requireAuth: boolean = false
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(requireAuth),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // 🔍 SEARCH NEARBY BUSINESSES
  async searchNearby(params: LocationSearchParams): Promise<{
    success: boolean;
    count: number;
    center: Coordinates;
    radius: number;
    results: BusinessLocation[];
  }> {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      ...(params.radius && { radius: params.radius.toString() }),
      ...(params.category && { category: params.category }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.makeRequest(`/nearby?${queryParams}`);
  }

  // 🧭 GEOCODE ADDRESS
  async geocodeAddress(address: string): Promise<{
    success: boolean;
    result: GeocodeResult;
  }> {
    return this.makeRequest('/geocode', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  // 🔄 REVERSE GEOCODE COORDINATES
  async reverseGeocode(coordinates: Coordinates): Promise<{
    success: boolean;
    result: GeocodeResult;
  }> {
    return this.makeRequest('/reverse-geocode', {
      method: 'POST',
      body: JSON.stringify(coordinates),
    });
  }

  // 📏 CALCULATE DISTANCE
  async calculateDistance(from: Coordinates, to: Coordinates): Promise<{
    success: boolean;
    from: Coordinates;
    to: Coordinates;
    distance: number;
    unit: string;
  }> {
    return this.makeRequest('/distance', {
      method: 'POST',
      body: JSON.stringify({ from, to }),
    });
  }

  // 🏢 CREATE/UPDATE BUSINESS LOCATION
  async createLocation(data: CreateLocationData): Promise<{
    success: boolean;
    location: {
      id: string;
      businessId: string;
      name: string;
      coordinates: Coordinates;
      address: any;
      radius: number;
      verified: boolean;
    };
  }> {
    return this.makeRequest('/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  // 📍 GET BUSINESS LOCATIONS
  async getBusinessLocations(businessId: string): Promise<{
    success: boolean;
    count: number;
    locations: Array<{
      id: string;
      name: string;
      coordinates: Coordinates;
      address: any;
      radius: number;
      verified: boolean;
      createdAt: string;
    }>;
  }> {
    return this.makeRequest(`/business/${businessId}`);
  }

  // 🗺️ GET LOCATIONS WITHIN BOUNDS
  async getLocationsInBounds(
    southwest: Coordinates, 
    northeast: Coordinates, 
    category?: string
  ): Promise<{
    success: boolean;
    bounds: {
      southwest: Coordinates;
      northeast: Coordinates;
    };
    count: number;
    locations: Array<{
      id: string;
      name: string;
      position: Coordinates;
      business: {
        id: string;
        name: string;
        category: string;
        rating: number;
      };
    }>;
  }> {
    const queryParams = new URLSearchParams({
      sw_lat: southwest.lat.toString(),
      sw_lng: southwest.lng.toString(),
      ne_lat: northeast.lat.toString(),
      ne_lng: northeast.lng.toString(),
      ...(category && { category }),
    });

    return this.makeRequest(`/bounds?${queryParams}`);
  }

  // 🔍 SEARCH PLACES (using browser geolocation + backend)
  async searchPlaces(query: string, location?: Coordinates): Promise<BusinessLocation[]> {
    try {
      // If location provided, search nearby with query
      if (location) {
        const nearby = await this.searchNearby({
          ...location,
          radius: 10000, // 10km radius
          limit: 20
        });

        // Filter results by query (simple text search)
        const filtered = nearby.results.filter(business =>
          business.name.toLowerCase().includes(query.toLowerCase()) ||
          business.business.name.toLowerCase().includes(query.toLowerCase()) ||
          business.business.category.toLowerCase().includes(query.toLowerCase())
        );

        return filtered;
      }

      // If no location, return empty array (could implement text-based search)
      console.warn('No location provided for place search');
      return [];

    } catch (error) {
      console.error('🗺️ Place search error:', error);
      throw error;
    }
  }

  // 📱 GET USER CURRENT LOCATION (browser geolocation)
  async getCurrentLocation(options?: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          let message = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          ...options
        }
      );
    });
  }

  // 👀 WATCH USER LOCATION (continuous tracking)
  watchLocation(
    callback: (location: Coordinates) => void,
    errorCallback?: (error: string) => void,
    options?: PositionOptions
  ): number | null {
    if (!navigator.geolocation) {
      errorCallback?.('Geolocation is not supported by this browser');
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let message = 'Unknown location error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        errorCallback?.(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        ...options
      }
    );
  }

  // 🛑 STOP WATCHING LOCATION
  clearLocationWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  // 🔄 UPDATE TOKEN (for authenticated requests)
  updateToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
}

// Create singleton instance
export const mapsAPI = new MapsAPI();

// Export default
export default mapsAPI;