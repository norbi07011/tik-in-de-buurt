import { useState, useEffect, useCallback } from 'react';
import { geocodeAddress, isStreetViewLikelyAvailable } from '../utils/geocoding';
import type { Address } from '../types';

interface Coordinates {
  lat: number;
  lng: number;
}

interface UseBusinessLocation {
  coordinates: Coordinates | null;
  isLoading: boolean;
  isStreetViewAvailable: boolean;
  error: string | null;
  getCoordinates: () => Promise<Coordinates | null>;
}

/**
 * Hook for managing business location and Street View availability
 */
export const useBusinessLocation = (address: Address, businessName?: string): UseBusinessLocation => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreetViewAvailable, setIsStreetViewAvailable] = useState(false);

  const getCoordinates = useCallback(async (): Promise<Coordinates | null> => {
    if (coordinates) return coordinates;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodeAddress(address);
      if (result) {
        setCoordinates(result);
        return result;
      } else {
        setError('Unable to locate address');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, coordinates]);

  // Check Street View availability on mount
  useEffect(() => {
    setIsStreetViewAvailable(isStreetViewLikelyAvailable(address));
  }, [address]);

  // Auto-geocode if likely to have Street View
  useEffect(() => {
    if (isStreetViewAvailable && !coordinates && !isLoading) {
      getCoordinates();
    }
  }, [isStreetViewAvailable, coordinates, isLoading, getCoordinates]);

  return {
    coordinates,
    isLoading,
    isStreetViewAvailable,
    error,
    getCoordinates
  };
};