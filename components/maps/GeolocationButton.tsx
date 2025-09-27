import React, { useState, useCallback, useEffect } from 'react';
import { MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// 🧭 Types
interface GeolocationButtonProps {
  onLocationUpdate: (location: { lat: number; lng: number }) => void;
  onLocationError: (error: string) => void;
  className?: string;
  autoLocate?: boolean;
  showStatus?: boolean;
}

interface LocationState {
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  lastUpdate: Date | null;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
}

const GeolocationButton: React.FC<GeolocationButtonProps> = ({
  onLocationUpdate,
  onLocationError,
  className = "",
  autoLocate = false,
  showStatus = true
}) => {
  const [locationState, setLocationState] = useState<LocationState>({
    position: null,
    accuracy: null,
    error: null,
    loading: false,
    lastUpdate: null,
    permissionState: 'unknown'
  });

  // 🔒 Check geolocation permission
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setLocationState(prev => ({ ...prev, permissionState: 'unknown' }));
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationState(prev => ({ ...prev, permissionState: permission.state as any }));
      return permission.state;
    } catch (error) {
      setLocationState(prev => ({ ...prev, permissionState: 'unknown' }));
      return 'unknown';
    }
  }, []);

  // 🧭 Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      setLocationState(prev => ({ ...prev, error, loading: false }));
      onLocationError(error);
      return;
    }

    setLocationState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setLocationState(prev => ({
          ...prev,
          position: location,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          lastUpdate: new Date()
        }));

        onLocationUpdate(location);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            setLocationState(prev => ({ ...prev, permissionState: 'denied' }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout. Please try again.';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }
        
        setLocationState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));

        onLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [onLocationUpdate, onLocationError]);

  // 📍 Watch position for continuous updates
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) return null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setLocationState(prev => ({
          ...prev,
          position: location,
          accuracy: position.coords.accuracy,
          lastUpdate: new Date()
        }));

        onLocationUpdate(location);
      },
      (error) => {
        console.warn('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );

    return watchId;
  }, [onLocationUpdate]);

  // 🔄 Refresh location
  const refreshLocation = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // 🚀 Auto-locate on mount
  useEffect(() => {
    checkPermission();
    
    if (autoLocate) {
      getCurrentLocation();
    }
  }, [autoLocate, getCurrentLocation, checkPermission]);

  // 🎨 Get button style based on state
  const getButtonStyle = () => {
    if (locationState.loading) {
      return 'bg-blue-500 text-white border-blue-500';
    }
    
    if (locationState.error) {
      return 'bg-red-500 text-white border-red-500 hover:bg-red-600';
    }
    
    if (locationState.position) {
      return 'bg-green-500 text-white border-green-500 hover:bg-green-600';
    }
    
    return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400';
  };

  // 📊 Get accuracy description
  const getAccuracyDescription = () => {
    if (!locationState.accuracy) return '';
    
    if (locationState.accuracy < 10) return 'Very High';
    if (locationState.accuracy < 50) return 'High';
    if (locationState.accuracy < 100) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 🧭 Main Location Button */}
      <button
        onClick={getCurrentLocation}
        disabled={locationState.loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border font-medium
          transition-all duration-200 shadow-sm
          ${getButtonStyle()}
          ${locationState.loading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={
          locationState.error 
            ? locationState.error 
            : locationState.position 
              ? 'Update location' 
              : 'Get my location'
        }
      >
        {locationState.loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Locating...</span>
          </>
        ) : locationState.error ? (
          <>
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm">Retry Location</span>
          </>
        ) : locationState.position ? (
          <>
            <MapPinIcon className="w-4 h-4" />
            <span className="text-sm">Update Location</span>
          </>
        ) : (
          <>
            <MapPinIcon className="w-4 h-4" />
            <span className="text-sm">Get My Location</span>
          </>
        )}
      </button>

      {/* 📊 Location Status */}
      {showStatus && (
        <div className="text-xs text-gray-600">
          {locationState.position && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Location Active</span>
              </div>
              
              {locationState.accuracy && (
                <div className="text-green-700">
                  Accuracy: {getAccuracyDescription()} ({Math.round(locationState.accuracy)}m)
                </div>
              )}
              
              {locationState.lastUpdate && (
                <div className="text-green-600 mt-1">
                  Updated: {locationState.lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {locationState.error && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
                <span className="font-medium text-red-800">Location Error</span>
              </div>
              <div className="text-red-700 text-xs">
                {locationState.error}
              </div>
              
              {locationState.permissionState === 'denied' && (
                <div className="mt-2 text-red-600 text-xs">
                  💡 Enable location in browser settings and refresh the page
                </div>
              )}
            </div>
          )}

          {!locationState.position && !locationState.loading && !locationState.error && (
            <div className="bg-gray-50 border border-gray-200 rounded p-2">
              <div className="text-gray-600">
                📍 Click to enable location-based features
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔄 Quick Actions */}
      {locationState.position && (
        <div className="flex gap-2">
          <button
            onClick={refreshLocation}
            disabled={locationState.loading}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border"
          >
            🔄 Refresh
          </button>
          
          <button
            onClick={() => {
              if (locationState.position) {
                const coords = `${locationState.position.lat.toFixed(6)}, ${locationState.position.lng.toFixed(6)}`;
                navigator.clipboard.writeText(coords);
              }
            }}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border"
          >
            📋 Copy Coords
          </button>
        </div>
      )}
    </div>
  );
};

export default GeolocationButton;
export type { GeolocationButtonProps, LocationState };