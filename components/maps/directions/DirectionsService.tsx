import React, { useCallback, useEffect, useRef } from 'react';
import { BusinessMarkerData } from '../GoogleMap';

// 🌐 Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

type GoogleLatLng = any;
type GoogleMap = any;
type GoogleTravelMode = any;
type GoogleDirectionsResult = any;
type GoogleDirectionsService = any;
type GoogleDirectionsRenderer = any;
type GoogleDirectionsStatus = any;

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
  coordinates: GoogleLatLng;
}

export interface RouteResult {
  routes: GoogleDirectionsResult;
  steps: RouteStep[];
  totalDistance: string;
  totalDuration: string;
  overview: GoogleLatLng[];
}

export interface DirectionsServiceProps {
  map: GoogleMap | null;
  origin: GoogleLatLng | null;
  destination: BusinessMarkerData | null;
  waypoints?: BusinessMarkerData[];
  travelMode: GoogleTravelMode;
  onRouteCalculated?: (result: RouteResult) => void;
  onRouteError?: (error: string) => void;
  onRouteCleared?: () => void;
}

const DirectionsService: React.FC<DirectionsServiceProps> = ({
  map,
  origin,
  destination,
  waypoints = [],
  travelMode,
  onRouteCalculated,
  onRouteError,
  onRouteCleared
}) => {
  const directionsServiceRef = useRef<GoogleDirectionsService | null>(null);
  const directionsRendererRef = useRef<GoogleDirectionsRenderer | null>(null);

  // Initialize Google Directions Service and Renderer
  useEffect(() => {
    if (!map || !window.google) return;

    // Initialize DirectionsService
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }

    // Initialize DirectionsRenderer with custom styling
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: map,
        draggable: true,
        panel: null, // We'll handle instructions in our own component
        polylineOptions: {
          strokeColor: '#4285f4',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
        markerOptions: {
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285f4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
          },
        },
        suppressMarkers: false, // Show start/end markers
        suppressInfoWindows: true, // We'll handle our own info windows
      });

      // Handle route dragging for optimization
      directionsRendererRef.current.addListener('directions_changed', () => {
        const directions = directionsRendererRef.current?.getDirections();
        if (directions) {
          processDirectionsResult(directions);
        }
      });
    } else {
      directionsRendererRef.current.setMap(map);
    }

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [map]);

  // Process directions result and extract route information
  const processDirectionsResult = useCallback((result: GoogleDirectionsResult): RouteResult => {
    const route = result.routes[0];
    const leg = route.legs[0];
    
    // Extract step-by-step instructions
    const steps: RouteStep[] = [];
    route.legs.forEach((leg: any) => {
      leg.steps.forEach((step: any) => {
        steps.push({
          instruction: step.instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
          distance: step.distance?.text || '',
          duration: step.duration?.text || '',
          maneuver: step.maneuver || 'straight',
          coordinates: step.start_location,
        });
      });
    });

    // Calculate total distance and duration
    const totalDistance = route.legs.reduce((acc: any, leg: any) => {
      return acc + (leg.distance?.value || 0);
    }, 0);

    const totalDuration = route.legs.reduce((acc: any, leg: any) => {
      return acc + (leg.duration?.value || 0);
    }, 0);

    // Extract overview path
    const overview = route.overview_path;

    return {
      routes: result,
      steps,
      totalDistance: formatDistance(totalDistance),
      totalDuration: formatDuration(totalDuration),
      overview,
    };
  }, []);

  // Calculate route using Google Directions API
  const calculateRoute = useCallback(async () => {
    if (!directionsServiceRef.current || !origin || !destination) {
      return;
    }

    try {
      // Prepare waypoints for Google API
      const googleWaypoints: any[] = waypoints.map(business => ({
        location: new window.google.maps.LatLng(business.position.lat, business.position.lng),
        stopover: true,
      }));

      const request: any = {
        origin: origin,
        destination: new window.google.maps.LatLng(destination.position.lat, destination.position.lng),
        waypoints: googleWaypoints,
        travelMode: travelMode,
        optimizeWaypoints: true, // Optimize waypoint order for efficiency
        avoidHighways: false,
        avoidTolls: false,
      };

      // Add transit-specific options
      if (travelMode === window.google.maps.TravelMode.TRANSIT) {
        request.transitOptions = {
          departureTime: new Date(),
          modes: [
            window.google.maps.TransitMode.BUS,
            window.google.maps.TransitMode.SUBWAY,
            window.google.maps.TransitMode.TRAIN,
            window.google.maps.TransitMode.TRAM,
          ],
          routingPreference: window.google.maps.TransitRoutePreference.BEST_ROUTE,
        };
      }

      directionsServiceRef.current.route(request, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          // Display route on map
          directionsRendererRef.current?.setDirections(result);
          
          // Process and return route data
          const routeResult = processDirectionsResult(result);
          onRouteCalculated?.(routeResult);
        } else {
          const errorMessage = getDirectionsErrorMessage(status);
          onRouteError?.(errorMessage);
        }
      });
    } catch (error) {
      onRouteError?.(`Failed to calculate route: ${error}`);
    }
  }, [origin, destination, waypoints, travelMode, processDirectionsResult, onRouteCalculated, onRouteError]);

  // Clear current route
  const clearRoute = useCallback(() => {
    directionsRendererRef.current?.setDirections({ routes: [] } as any);
    onRouteCleared?.();
  }, [onRouteCleared]);

  // Calculate route when parameters change
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    } else {
      clearRoute();
    }
  }, [origin, destination, waypoints, travelMode, calculateRoute, clearRoute]);

  // Update travel mode styling
  useEffect(() => {
    if (directionsRendererRef.current) {
      const colors = {
        [window.google.maps.TravelMode.DRIVING]: '#4285f4',
        [window.google.maps.TravelMode.WALKING]: '#34a853',
        [window.google.maps.TravelMode.BICYCLING]: '#fbbc04',
        [window.google.maps.TravelMode.TRANSIT]: '#ea4335',
      };

      directionsRendererRef.current.setOptions({
        polylineOptions: {
          strokeColor: colors[travelMode] || '#4285f4',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
    }
  }, [travelMode]);

  // This component doesn't render anything visible
  return null;
};

// Helper function to format distance
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes} min`;
  }
};

// Helper function to get user-friendly error messages
const getDirectionsErrorMessage = (status: GoogleDirectionsStatus): string => {
  switch (status) {
    case window.google.maps.DirectionsStatus.NOT_FOUND:
      return 'Location not found. Please check the address.';
    case window.google.maps.DirectionsStatus.ZERO_RESULTS:
      return 'No route found between these locations.';
    case window.google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
      return 'Too many waypoints. Maximum 10 stops allowed.';
    case window.google.maps.DirectionsStatus.INVALID_REQUEST:
      return 'Invalid route request. Please try again.';
    case window.google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
      return 'Too many requests. Please try again later.';
    case window.google.maps.DirectionsStatus.REQUEST_DENIED:
      return 'Directions request denied. Please check API settings.';
    case window.google.maps.DirectionsStatus.UNKNOWN_ERROR:
      return 'Unknown error occurred. Please try again.';
    default:
      return 'Failed to calculate route. Please try again.';
  }
};

export default DirectionsService;