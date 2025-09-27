// 🗺️ Google Maps Configuration
export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
  mapOptions: {
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    mapTypeControl?: boolean;
  };
  defaultCenter: {
    lat: number;
    lng: number;
  };
  defaultZoom: number;
  language: string;
  region: string;
}

// Default configuration for Netherlands/Amsterdam area
export const GOOGLE_MAPS_CONFIG: GoogleMapsConfig = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry', 'drawing'],
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    mapTypeControl: false
  },
  defaultCenter: {
    lat: 52.3676, // Amsterdam coordinates
    lng: 4.9041
  },
  defaultZoom: 12,
  language: 'nl',
  region: 'NL'
};

// Map styles for different themes
export const MAP_STYLES = {
  // Standard Google Maps style
  default: [],
  
  // Dark theme for night mode
  dark: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ],

  // Light blue theme
  lightBlue: [
    {
      featureType: "all",
      elementType: "all",
      stylers: [{ saturation: "32" }, { lightness: "-3" }, { visibility: "on" }, { weight: "1.18" }]
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [{ visibility: "on" }]
    },
    {
      featureType: "landscape",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "landscape.man_made",
      elementType: "all",
      stylers: [{ saturation: "-70" }, { lightness: "14" }]
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [{ saturation: "100" }, { lightness: "-14" }]
    },
    {
      featureType: "water",
      elementType: "labels",
      stylers: [{ visibility: "off" }, { lightness: "12" }]
    }
  ]
};

// Marker icons configuration (template for runtime creation)
export const MARKER_ICONS = {
  default: {
    url: '/icons/marker-default.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  restaurant: {
    url: '/icons/marker-restaurant.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  shop: {
    url: '/icons/marker-shop.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  service: {
    url: '/icons/marker-service.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  health: {
    url: '/icons/marker-health.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  education: {
    url: '/icons/marker-education.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  entertainment: {
    url: '/icons/marker-entertainment.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  beauty: {
    url: '/icons/marker-beauty.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  automotive: {
    url: '/icons/marker-automotive.svg',
    size: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  },
  user: {
    url: '/icons/marker-user.svg',
    size: { width: 30, height: 30 },
    anchor: { x: 15, y: 15 }
  }
};

// Validate Google Maps API key
export function validateGoogleMapsApiKey(): boolean {
  const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
  
  if (!apiKey) {
    console.warn('⚠️ Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY environment variable.');
    return false;
  }

  if (apiKey.length < 30) {
    console.warn('⚠️ Google Maps API key appears to be invalid (too short).');
    return false;
  }

  return true;
}

// Get marker icon based on business category
export function getMarkerIcon(category: string) {
  const iconKey = category.toLowerCase() as keyof typeof MARKER_ICONS;
  const iconConfig = MARKER_ICONS[iconKey] || MARKER_ICONS.default;
  
  // Return configuration that can be used to create Google Maps icon at runtime
  return {
    url: iconConfig.url,
    scaledSize: iconConfig.size,
    anchor: iconConfig.anchor
  };
}

// Create Google Maps icon from configuration (use after Maps API is loaded)
export function createGoogleMapsIcon(iconConfig: ReturnType<typeof getMarkerIcon>) {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return {
      url: iconConfig.url,
      scaledSize: new window.google.maps.Size(iconConfig.scaledSize.width, iconConfig.scaledSize.height),
      anchor: new window.google.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y)
    };
  }
  return iconConfig;
}

// Environment-specific configurations
export const MAPS_ENVIRONMENTS = {
  development: {
    ...GOOGLE_MAPS_CONFIG,
    mapOptions: {
      ...GOOGLE_MAPS_CONFIG.mapOptions,
      disableDefaultUI: false // Show all controls in development
    }
  },
  production: {
    ...GOOGLE_MAPS_CONFIG,
    mapOptions: {
      ...GOOGLE_MAPS_CONFIG.mapOptions,
      disableDefaultUI: false
    }
  }
};

// Get configuration based on environment
export function getGoogleMapsConfig(): GoogleMapsConfig {
  const env = process.env.NODE_ENV || 'development';
  return MAPS_ENVIRONMENTS[env as keyof typeof MAPS_ENVIRONMENTS] || GOOGLE_MAPS_CONFIG;
}