/**
 * 🏠 Street View Service
 * 
 * Service for checking Street View availability and managing Street View operations
 * Provides utilities for verifying coverage and getting panorama data
 */

interface StreetViewServiceConfig {
  radius?: number; // Search radius in meters (default: 50)
  source?: 'default' | 'outdoor'; // Prefer outdoor imagery
}

interface StreetViewCoverageResult {
  available: boolean;
  location?: { lat: number; lng: number };
  panoId?: string;
  distance?: number; // Distance from original point
  copyright?: string;
}

interface StreetViewPanoramaData {
  location: { lat: number; lng: number };
  panoId: string;
  tiles: {
    centerHeading: number;
    tileSize: { width: number; height: number };
  };
  copyright: string;
  imageDate: string;
}

export class StreetViewService {
  private streetViewService: any;
  private config: StreetViewServiceConfig;

  constructor(config: StreetViewServiceConfig = {}) {
    this.config = {
      radius: config.radius || 50,
      source: config.source || 'default'
    };

    // Initialize Google Maps Street View Service
    if ((window as any).google?.maps) {
      this.streetViewService = new (window as any).google.maps.StreetViewService();
    }
  }

  /**
   * Check if Street View is available for a specific location
   */
  async checkCoverage(position: { lat: number; lng: number }): Promise<StreetViewCoverageResult> {
    return new Promise((resolve) => {
      if (!this.streetViewService) {
        resolve({ available: false });
        return;
      }

      const latLng = new (window as any).google.maps.LatLng(position.lat, position.lng);

      this.streetViewService.getPanorama({
        location: latLng,
        radius: this.config.radius,
        source: this.config.source === 'outdoor' 
          ? (window as any).google.maps.StreetViewSource.OUTDOOR 
          : (window as any).google.maps.StreetViewSource.DEFAULT
      }, (data: any, status: any) => {
        if (status === (window as any).google.maps.StreetViewStatus.OK && data) {
          const location = data.location.latLng;
          const originalLatLng = new (window as any).google.maps.LatLng(position.lat, position.lng);
          const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
            originalLatLng, 
            location
          );

          resolve({
            available: true,
            location: {
              lat: location.lat(),
              lng: location.lng()
            },
            panoId: data.location.pano,
            distance: Math.round(distance),
            copyright: data.copyright
          });
        } else {
          resolve({ available: false });
        }
      });
    });
  }

  /**
   * Get detailed panorama data for a location
   */
  async getPanoramaData(position: { lat: number; lng: number }): Promise<StreetViewPanoramaData | null> {
    return new Promise((resolve) => {
      if (!this.streetViewService) {
        resolve(null);
        return;
      }

      const latLng = new (window as any).google.maps.LatLng(position.lat, position.lng);

      this.streetViewService.getPanorama({
        location: latLng,
        radius: this.config.radius
      }, (data: any, status: any) => {
        if (status === (window as any).google.maps.StreetViewStatus.OK && data) {
          resolve({
            location: {
              lat: data.location.latLng.lat(),
              lng: data.location.latLng.lng()
            },
            panoId: data.location.pano,
            tiles: {
              centerHeading: data.tiles?.centerHeading || 0,
              tileSize: {
                width: data.tiles?.tileSize?.width || 512,
                height: data.tiles?.tileSize?.height || 512
              }
            },
            copyright: data.copyright || 'Google',
            imageDate: data.imageDate || new Date().getFullYear().toString()
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Check Street View coverage for multiple locations
   */
  async checkMultipleCoverage(
    positions: { lat: number; lng: number }[]
  ): Promise<(StreetViewCoverageResult & { originalIndex: number })[]> {
    const promises = positions.map((position, index) =>
      this.checkCoverage(position).then(result => ({
        ...result,
        originalIndex: index
      }))
    );

    return Promise.all(promises);
  }

  /**
   * Find nearest Street View location
   */
  async findNearestStreetView(
    position: { lat: number; lng: number },
    maxRadius: number = 200
  ): Promise<StreetViewCoverageResult> {
    // Try increasing radii until we find coverage
    const radii = [25, 50, 100, maxRadius];
    
    for (const radius of radii) {
      this.config.radius = radius;
      
      const result = await this.checkCoverage(position);
      if (result.available) {
        return result;
      }
    }

    return { available: false };
  }

  /**
   * Get Street View URL for a location (for fallback/sharing)
   */
  getStreetViewUrl(
    position: { lat: number; lng: number },
    options: {
      heading?: number;
      pitch?: number;
      fov?: number; // Field of view
    } = {}
  ): string {
    const { heading = 0, pitch = 0, fov = 90 } = options;
    
    const baseUrl = 'https://www.google.com/maps/@';
    const params = `${position.lat},${position.lng},3a,${fov}y,${heading}h,${pitch}t`;
    
    return `${baseUrl}${params}/data=!3m1!1e3`;
  }

  /**
   * Check if user is in a region where Street View is available
   */
  isStreetViewSupportedRegion(position: { lat: number; lng: number }): boolean {
    // Street View is widely available in Europe, North America, parts of Asia, etc.
    // This is a simplified check - in production you might want more sophisticated region detection
    
    const { lat, lng } = position;
    
    // Europe (including Netherlands)
    if (lat >= 35 && lat <= 71 && lng >= -25 && lng <= 45) return true;
    
    // North America
    if (lat >= 25 && lat <= 75 && lng >= -170 && lng <= -50) return true;
    
    // Parts of Asia
    if (lat >= 0 && lat <= 50 && lng >= 95 && lng <= 145) return true;
    
    // Australia/New Zealand
    if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) return true;
    
    return false;
  }
}

// Export singleton instance
export const streetViewService = new StreetViewService();

// Export default for named imports
export default StreetViewService;