import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import ClusterManager from './clustering/ClusterManager';
import { DirectionsService, RouteControls, RoutePanel } from './directions';
import { useRoute } from './directions/RouteProvider';

// 🗺️ Types
interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface MapProps {
  center?: LatLngLiteral;
  zoom?: number;
  onMapLoad?: (map: any) => void;
  onLocationSelect?: (location: LatLngLiteral) => void;
  children?: React.ReactNode;
  className?: string;
  businesses?: BusinessMarkerData[];
  showUserLocation?: boolean;
  // Clustering props
  enableClustering?: boolean;
  clusterGridSize?: number;
  clusterAlgorithm?: 'grid' | 'kmeans' | 'supercluster';
  onClusterClick?: (cluster: any) => void;
  // Directions props
  enableDirections?: boolean;
  onBusinessSelect?: (business: BusinessMarkerData) => void;
  showRouteControls?: boolean;
  showRoutePanel?: boolean;
}

interface BusinessMarkerData {
  id: string;
  name: string;
  position: LatLngLiteral;
  category: string;
  rating?: number;
  isOpen?: boolean;
  isVerified?: boolean;
  address?: string;
  phone?: string;
  website?: string;
}

interface GeolocationState {
  position: LatLngLiteral | null;
  error: string | null;
  loading: boolean;
}

// 📍 Default locations (Amsterdam/Netherlands area)
const DEFAULT_CENTER: LatLngLiteral = {
  lat: 52.3676, // Amsterdam
  lng: 4.9041
};

const DEFAULT_ZOOM = 13;

// 🗺️ Core Map Component
const MapComponent: React.FC<MapProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onMapLoad,
  onLocationSelect,
  businesses = [],
  showUserLocation = true,
  className = "w-full h-96 rounded-lg shadow-lg",
  enableClustering = false,
  clusterGridSize = 60,
  clusterAlgorithm = 'grid',
  onClusterClick,
  enableDirections = false,
  onBusinessSelect,
  showRouteControls = true,
  showRoutePanel = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false
  });
  const [markers, setMarkers] = useState<any[]>([]);
  const clusterManagerRef = useRef<any>(null);
  
  // 🛣️ Route Context (only if directions enabled)
  const routeContext = enableDirections ? useRoute() : null;

  // 📍 Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        // Custom map styling for better UX
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }] // Hide default business markers
        }
      ]
    });

    setMap(mapInstance);
    onMapLoad?.(mapInstance);

    // Add click listener for location selection
    const clickListener = mapInstance.addListener('click', (e: any) => {
      if (e.latLng) {
        const position = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        onLocationSelect?.(position);
      }
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(clickListener);
      }
    };
  }, [center, zoom, onMapLoad, onLocationSelect]);

  // 🧭 Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setUserLocation({
        position: null,
        error: 'Geolocation is not supported by this browser',
        loading: false
      });
      return;
    }

    setUserLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation({
          position: pos,
          error: null,
          loading: false
        });

        // Center map on user location
        if (map) {
          map.setCenter(pos);
          map.setZoom(15);
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }
        
        setUserLocation({
          position: null,
          error: errorMessage,
          loading: false
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [map]);

  // 📍 Add user location marker
  useEffect(() => {
    if (!map || !userLocation.position || !window.google) return;

    const userMarker = new window.google.maps.Marker({
      position: userLocation.position,
      map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      }
    });

    return () => {
      userMarker.setMap(null);
    };
  }, [map, userLocation.position]);

  // 🏢 Add business markers
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    if (businesses.length === 0) {
      setMarkers([]);
      return;
    }

    // Create new markers
    const newMarkers = businesses.map(business => {
      const marker = new window.google.maps.Marker({
        position: business.position,
        map: enableClustering ? null : map, // Don't add to map directly if clustering
        title: business.name,
        icon: {
          url: getBusinessIcon(business.category),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        }
      });

      // Store business data on marker for clustering
      (marker as any).businessData = business;

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(business)
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, businesses, enableClustering]);

  // 🎨 Get business category icon
  const getBusinessIcon = (category: string): string => {
    const iconBase = 'data:image/svg+xml;base64,';
    const icons: Record<string, string> = {
      restaurant: btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/></svg>`),
      retail: btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4ECDC4"><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v12z"/></svg>`),
      healthcare: btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF4757"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`),
      service: btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5F27CD"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`),
      default: btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2C2C54"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`)
    };
    
    return iconBase + (icons[category] || icons.default);
  };

  // 🏢 Create info window content
  const createInfoWindowContent = (business: BusinessMarkerData): string => {
    return `
      <div class="p-3 max-w-xs">
        <h3 class="font-bold text-lg mb-2">${business.name}</h3>
        ${business.rating ? `
          <div class="flex items-center mb-2">
            <span class="text-yellow-500">★</span>
            <span class="ml-1 text-sm">${business.rating}/5</span>
            ${business.isOpen ? 
              '<span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Open</span>' : 
              '<span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Closed</span>'
            }
          </div>
        ` : ''}
        ${business.address ? `<p class="text-sm text-gray-600 mb-2">${business.address}</p>` : ''}
        ${business.phone ? `<p class="text-sm text-gray-600 mb-2">📞 ${business.phone}</p>` : ''}
        <div class="flex gap-2 mt-3">
          <button class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
            View Details
          </button>
          <button class="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
            Directions
          </button>
        </div>
      </div>
    `;
  };

  // 🎮 Auto-locate user on mount
  useEffect(() => {
    if (showUserLocation) {
      getUserLocation();
    }
  }, [showUserLocation, getUserLocation]);

  // 🛣️ Handle business selection for directions
  const handleBusinessSelect = useCallback((business: BusinessMarkerData) => {
    if (enableDirections && routeContext) {
      routeContext.setDestination(business);
      // Set user location as origin if available
      if (userLocation.position) {
        const origin = new window.google.maps.LatLng(
          userLocation.position.lat, 
          userLocation.position.lng
        );
        routeContext.setOrigin(origin);
      }
    }
    onBusinessSelect?.(business);
  }, [enableDirections, routeContext, userLocation.position, onBusinessSelect]);

  return (
    <div className="relative">
      <div ref={mapRef} className={className} />
      
      {/* 🛣️ Directions Service */}
      {enableDirections && routeContext && map && (
        <DirectionsService
          map={map}
          origin={routeContext.state.origin}
          destination={routeContext.state.destination}
          waypoints={routeContext.state.waypoints}
          travelMode={routeContext.state.travelMode}
          onRouteCalculated={routeContext.setRouteResult}
          onRouteError={routeContext.setRouteError}
          onRouteCleared={() => routeContext.clearRoute()}
        />
      )}
      
      {/* 🏢 Clustering Manager */}
      {enableClustering && map && businesses.length > 0 && markers.length > 0 && (
        <ClusterManager
          map={map}
          businesses={businesses}
          markers={markers}
          config={{
            gridSize: clusterGridSize,
            enabled: true,
            minClusterSize: 2,
            maxZoom: 15,
            zoomOnClick: true,
            averageCenter: true,
            ignoreHidden: false
          }}
          onClusterClick={onClusterClick}
        />
      )}
      
      {/* 🧭 Geolocation Controls */}
      {showUserLocation && (
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            onClick={getUserLocation}
            disabled={userLocation.loading}
            className={`
              px-3 py-2 bg-white shadow-lg rounded-lg border hover:bg-gray-50
              flex items-center gap-2 text-sm font-medium
              ${userLocation.loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title="Get my location"
          >
            {userLocation.loading ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            )}
            Locate Me
          </button>
          
          {userLocation.error && (
            <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded border">
              {userLocation.error}
            </div>
          )}
        </div>
      )}
      
      {/* 🛣️ Route Controls */}
      {enableDirections && routeContext && showRouteControls && (
        <RouteControls
          origin={userLocation.position}
          destination={routeContext.state.destination}
          waypoints={routeContext.state.waypoints}
          travelMode={routeContext.state.travelMode}
          isCalculating={routeContext.state.isCalculating}
          onTravelModeChange={routeContext.setTravelMode}
          onAddWaypoint={routeContext.addWaypoint}
          onRemoveWaypoint={routeContext.removeWaypoint}
          onReorderWaypoints={routeContext.reorderWaypoints}
          onClearRoute={routeContext.clearRoute}
          onSaveRoute={() => routeContext.saveRoute('My Route')}
          onShareRoute={() => {/* Implement share functionality */}}
        />
      )}
      
      {/* 🛣️ Route Panel */}
      {enableDirections && routeContext && showRoutePanel && (
        <RoutePanel
          route={routeContext.state.activeRoute}
          isVisible={routeContext.state.isRoutePanelVisible}
          onClose={() => routeContext.setRoutePanelVisible(false)}
          onStepClick={(stepIndex) => {
            routeContext.setSelectedStep(stepIndex);
            // Focus map on step location - implement later
          }}
        />
      )}
    </div>
  );
};

// 🗺️ Wrapper Component with API Key
interface GoogleMapProps extends MapProps {
  apiKey: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ apiKey, ...props }) => {
  const render = (status: Status): React.ReactElement => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className={`${props.className || 'w-full h-96'} flex items-center justify-center bg-gray-100 rounded-lg`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading map...</span>
            </div>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className={`${props.className || 'w-full h-96'} flex items-center justify-center bg-red-50 rounded-lg border border-red-200`}>
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️</div>
              <p className="text-red-700 font-medium">Failed to load map</p>
              <p className="text-red-600 text-sm">Please check your API key</p>
            </div>
          </div>
        );
      case Status.SUCCESS:
        return <MapComponent {...props} />;
      default:
        return (
          <div className={`${props.className || 'w-full h-96'} flex items-center justify-center bg-gray-100 rounded-lg`}>
            <span className="text-gray-500">Loading...</span>
          </div>
        );
    }
  };

  return (
    <Wrapper apiKey={apiKey} render={render} libraries={['places', 'geometry']} />
  );
};

export default GoogleMap;
export type { BusinessMarkerData, MapProps, GoogleMapProps };