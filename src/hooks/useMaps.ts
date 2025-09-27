import { useState, useEffect, useCallback, useRef } from 'react';
import { mapsAPI, type Coordinates, type BusinessLocation, type LocationSearchParams } from '../api/maps';

// 🗺️ Maps Hook Interface
export interface UseMapsState {
  // Location state
  userLocation: Coordinates | null;
  isLocationLoading: boolean;
  locationError: string | null;
  
  // Search state
  nearbyBusinesses: BusinessLocation[];
  isSearchLoading: boolean;
  searchError: string | null;
  
  // Permissions
  hasLocationPermission: boolean;
  
  // Map state
  mapCenter: Coordinates;
  mapZoom: number;
  selectedBusiness: BusinessLocation | null;
}

export interface UseMapsActions {
  // Location actions
  getCurrentLocation: () => Promise<void>;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  
  // Search actions
  searchNearby: (params: Omit<LocationSearchParams, 'lat' | 'lng'>) => Promise<void>;
  searchAt: (location: Coordinates, params?: Omit<LocationSearchParams, 'lat' | 'lng'>) => Promise<void>;
  clearSearch: () => void;
  
  // Map actions
  setMapCenter: (location: Coordinates) => void;
  setMapZoom: (zoom: number) => void;
  selectBusiness: (business: BusinessLocation | null) => void;
  
  // Utility actions
  geocodeAddress: (address: string) => Promise<Coordinates | null>;
  calculateDistance: (to: Coordinates) => Promise<number | null>;
}

// Default configuration from environment
const DEFAULT_CENTER: Coordinates = {
  lat: parseFloat(import.meta.env.VITE_DEFAULT_LAT || '52.3676'),
  lng: parseFloat(import.meta.env.VITE_DEFAULT_LNG || '4.9041')
};

const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_DEFAULT_ZOOM || '12');
const DEFAULT_RADIUS = parseInt(import.meta.env.VITE_MAPS_DEFAULT_RADIUS || '5000');

// 🗺️ Main Maps Hook
export function useMaps(): UseMapsState & UseMapsActions {
  // State management
  const [state, setState] = useState<UseMapsState>({
    userLocation: null,
    isLocationLoading: false,
    locationError: null,
    nearbyBusinesses: [],
    isSearchLoading: false,
    searchError: null,
    hasLocationPermission: false,
    mapCenter: DEFAULT_CENTER,
    mapZoom: DEFAULT_ZOOM,
    selectedBusiness: null
  });

  // Refs for cleanup
  const locationWatchId = useRef<number | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // 📍 Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
    
    return () => {
      // Cleanup on unmount
      stopLocationTracking();
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // 🔒 Check if geolocation permission is granted
  const checkLocationPermission = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({
          ...prev,
          hasLocationPermission: permission.state === 'granted'
        }));
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          setState(prev => ({
            ...prev,
            hasLocationPermission: permission.state === 'granted'
          }));
        });
      } catch (error) {
        console.warn('🗺️ Permission API not supported:', error);
      }
    }
  }, []);

  // 📍 Get current user location
  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLocationLoading: true, locationError: null }));

    try {
      const location = await mapsAPI.getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      setState(prev => ({
        ...prev,
        userLocation: location,
        mapCenter: location,
        isLocationLoading: false,
        hasLocationPermission: true
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setState(prev => ({
        ...prev,
        locationError: errorMessage,
        isLocationLoading: false,
        hasLocationPermission: false
      }));
      console.error('🗺️ Location error:', error);
    }
  }, []);

  // 👀 Start continuous location tracking
  const startLocationTracking = useCallback(() => {
    if (locationWatchId.current !== null) {
      return; // Already tracking
    }

    locationWatchId.current = mapsAPI.watchLocation(
      (location) => {
        setState(prev => ({
          ...prev,
          userLocation: location,
          hasLocationPermission: true
        }));
      },
      (error) => {
        setState(prev => ({
          ...prev,
          locationError: error,
          hasLocationPermission: false
        }));
        console.error('🗺️ Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }, []);

  // 🛑 Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (locationWatchId.current !== null) {
      mapsAPI.clearLocationWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  }, []);

  // 🔍 Search nearby businesses
  const searchNearby = useCallback(async (params: Omit<LocationSearchParams, 'lat' | 'lng'>) => {
    if (!state.userLocation) {
      setState(prev => ({ 
        ...prev, 
        searchError: 'User location is required for nearby search' 
      }));
      return;
    }

    await searchAt(state.userLocation, params);
  }, [state.userLocation]);

  // 🔍 Search businesses at specific location
  const searchAt = useCallback(async (
    location: Coordinates, 
    params: Omit<LocationSearchParams, 'lat' | 'lng'> = {}
  ) => {
    // Abort previous request if still running
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setState(prev => ({ ...prev, isSearchLoading: true, searchError: null }));

    try {
      const searchParams: LocationSearchParams = {
        lat: location.lat,
        lng: location.lng,
        radius: params.radius || DEFAULT_RADIUS,
        category: params.category,
        limit: params.limit || 50
      };

      const result = await mapsAPI.searchNearby(searchParams);

      setState(prev => ({
        ...prev,
        nearbyBusinesses: result.results,
        isSearchLoading: false
      }));

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was aborted, ignore
      }

      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({
        ...prev,
        searchError: errorMessage,
        isSearchLoading: false
      }));
      console.error('🗺️ Search error:', error);
    }
  }, []);

  // 🧹 Clear search results
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      nearbyBusinesses: [],
      searchError: null,
      selectedBusiness: null
    }));
  }, []);

  // 🗺️ Set map center
  const setMapCenter = useCallback((location: Coordinates) => {
    setState(prev => ({ ...prev, mapCenter: location }));
  }, []);

  // 🔍 Set map zoom
  const setMapZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, mapZoom: zoom }));
  }, []);

  // 📍 Select business
  const selectBusiness = useCallback((business: BusinessLocation | null) => {
    setState(prev => ({ ...prev, selectedBusiness: business }));
  }, []);

  // 🧭 Geocode address to coordinates
  const geocodeAddress = useCallback(async (address: string): Promise<Coordinates | null> => {
    try {
      const result = await mapsAPI.geocodeAddress(address);
      return result.result.coordinates;
    } catch (error) {
      console.error('🗺️ Geocoding error:', error);
      return null;
    }
  }, []);

  // 📏 Calculate distance from user location
  const calculateDistance = useCallback(async (to: Coordinates): Promise<number | null> => {
    if (!state.userLocation) {
      return null;
    }

    try {
      const result = await mapsAPI.calculateDistance(state.userLocation, to);
      return result.distance;
    } catch (error) {
      console.error('🗺️ Distance calculation error:', error);
      return null;
    }
  }, [state.userLocation]);

  return {
    // State
    ...state,
    
    // Actions
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking,
    searchNearby,
    searchAt,
    clearSearch,
    setMapCenter,
    setMapZoom,
    selectBusiness,
    geocodeAddress,
    calculateDistance
  };
}

// 🎯 Geolocation Permission Hook
export function useGeolocationPermission() {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (!('permissions' in navigator)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        setPermission(permissionStatus.state);
        
        permissionStatus.addEventListener('change', () => {
          setPermission(permissionStatus.state);
        });
      })
      .catch(() => {
        setIsSupported(false);
      });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      await mapsAPI.getCurrentLocation();
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission
  };
}

export default useMaps;