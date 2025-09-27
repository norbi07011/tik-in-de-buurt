import { logger } from '../utils/logger';

// 🌍 Types
interface Coordinates {
  lat: number;
  lng: number;
}

interface AddressComponents {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  formatted?: string;
}

interface GeocodeResult {
  coordinates: Coordinates;
  address: AddressComponents;
  placeId?: string;
  accuracy?: number;
  viewport?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

interface NearbySearchOptions {
  coordinates: Coordinates;
  radius: number; // in meters
  type?: string;
  keyword?: string;
  minRating?: number;
  openNow?: boolean;
}

interface DistanceCalculationResult {
  distance: number; // in kilometers
  duration?: number; // in seconds
  unit: 'km' | 'miles';
}

class GeolocationService {
  private googleMapsApiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.googleMapsApiKey) {
      logger.warn('🗺️ Google Maps API key not configured - using fallback methods');
    }
  }

  // 🧮 Calculate distance between two points using Haversine formula
  calculateDistance(point1: Coordinates, point2: Coordinates): DistanceCalculationResult {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return {
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      unit: 'km'
    };
  }

  // 📐 Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // 🔍 Geocode address to coordinates
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.googleMapsApiKey) {
      logger.warn('🗺️ Cannot geocode without Google Maps API key');
      return this.fallbackGeocode(address);
    }

    try {
      const url = `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        return {
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          address: this.parseAddressComponents(result.address_components, result.formatted_address),
          placeId: result.place_id,
          viewport: result.geometry.viewport ? {
            northeast: result.geometry.viewport.northeast,
            southwest: result.geometry.viewport.southwest
          } : undefined
        };
      }

      logger.warn(`🗺️ Geocoding failed for address: ${address} - Status: ${data.status}`);
      return null;
    } catch (error) {
      logger.error('🗺️ Geocoding error:', error);
      return this.fallbackGeocode(address);
    }
  }

  // 🔄 Reverse geocode coordinates to address
  async reverseGeocode(coordinates: Coordinates): Promise<GeocodeResult | null> {
    if (!this.googleMapsApiKey) {
      logger.warn('🗺️ Cannot reverse geocode without Google Maps API key');
      return {
        coordinates,
        address: { formatted: `${coordinates.lat}, ${coordinates.lng}` }
      };
    }

    try {
      const url = `${this.baseUrl}/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${this.googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        
        return {
          coordinates,
          address: this.parseAddressComponents(result.address_components, result.formatted_address),
          placeId: result.place_id
        };
      }

      return {
        coordinates,
        address: { formatted: `${coordinates.lat}, ${coordinates.lng}` }
      };
    } catch (error) {
      logger.error('🗺️ Reverse geocoding error:', error);
      return {
        coordinates,
        address: { formatted: `${coordinates.lat}, ${coordinates.lng}` }
      };
    }
  }

  // 🏢 Search for nearby places
  async searchNearby(options: NearbySearchOptions): Promise<any[]> {
    if (!this.googleMapsApiKey) {
      logger.warn('🗺️ Cannot search nearby without Google Maps API key');
      return [];
    }

    try {
      let url = `${this.baseUrl}/place/nearbysearch/json?location=${options.coordinates.lat},${options.coordinates.lng}&radius=${options.radius}&key=${this.googleMapsApiKey}`;
      
      if (options.type) {
        url += `&type=${options.type}`;
      }
      
      if (options.keyword) {
        url += `&keyword=${encodeURIComponent(options.keyword)}`;
      }
      
      if (options.openNow) {
        url += `&opennow`;
      }

      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.status === 'OK') {
        return data.results
          .filter((place: any) => !options.minRating || place.rating >= options.minRating)
          .map((place: any) => ({
            placeId: place.place_id,
            name: place.name,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            address: place.vicinity,
            rating: place.rating,
            priceLevel: place.price_level,
            types: place.types,
            openNow: place.opening_hours?.open_now,
            photos: place.photos?.map((photo: any) => ({
              reference: photo.photo_reference,
              width: photo.width,
              height: photo.height
            }))
          }));
      }

      return [];
    } catch (error) {
      logger.error('🗺️ Nearby search error:', error);
      return [];
    }
  }

  // 🎯 Check if coordinates are within bounds
  isWithinBounds(
    coordinates: Coordinates,
    bounds: {
      northeast: Coordinates;
      southwest: Coordinates;
    }
  ): boolean {
    return (
      coordinates.lat >= bounds.southwest.lat &&
      coordinates.lat <= bounds.northeast.lat &&
      coordinates.lng >= bounds.southwest.lng &&
      coordinates.lng <= bounds.northeast.lng
    );
  }

  // 🔍 Validate coordinates
  isValidCoordinates(coordinates: Coordinates): boolean {
    return (
      coordinates.lat >= -90 && coordinates.lat <= 90 &&
      coordinates.lng >= -180 && coordinates.lng <= 180 &&
      !isNaN(coordinates.lat) && 
      !isNaN(coordinates.lng)
    );
  }

  // 📊 Get country/region from coordinates
  async getLocationInfo(coordinates: Coordinates): Promise<{
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  }> {
    const geocodeResult = await this.reverseGeocode(coordinates);
    
    if (geocodeResult?.address) {
      return {
        country: geocodeResult.address.country,
        city: geocodeResult.address.city,
        region: geocodeResult.address.city
      };
    }

    return {};
  }

  // 🌍 Parse address components from Google's response
  private parseAddressComponents(components: any[], formattedAddress: string): AddressComponents {
    const parsed: AddressComponents = {
      formatted: formattedAddress
    };

    for (const component of components) {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        parsed.street = (parsed.street || '') + ' ' + component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        parsed.city = component.long_name;
      } else if (types.includes('postal_code')) {
        parsed.postalCode = component.long_name;
      } else if (types.includes('country')) {
        parsed.country = component.long_name;
      }
    }

    parsed.street = parsed.street?.trim();
    
    return parsed;
  }

  // 🔄 Fallback geocoding for when API is unavailable
  private fallbackGeocode(address: string): GeocodeResult | null {
    // Simple fallback - could be enhanced with offline geocoding database
    logger.info(`🗺️ Using fallback geocoding for: ${address}`);
    
    // Return Amsterdam center as fallback
    return {
      coordinates: { lat: 52.3676, lng: 4.9041 },
      address: {
        formatted: address,
        city: 'Amsterdam',
        country: 'Netherlands'
      }
    };
  }

  // 🎯 Generate bounding box around coordinates
  generateBounds(center: Coordinates, radiusKm: number): {
    northeast: Coordinates;
    southwest: Coordinates;
  } {
    const latChange = radiusKm / 111.32; // 1 degree lat ≈ 111.32 km
    const lngChange = radiusKm / (111.32 * Math.cos(center.lat * Math.PI / 180));

    return {
      northeast: {
        lat: center.lat + latChange,
        lng: center.lng + lngChange
      },
      southwest: {
        lat: center.lat - latChange,
        lng: center.lng - lngChange
      }
    };
  }
}

export const geolocationService = new GeolocationService();
export default geolocationService;
export type { 
  Coordinates, 
  AddressComponents, 
  GeocodeResult, 
  NearbySearchOptions, 
  DistanceCalculationResult 
};