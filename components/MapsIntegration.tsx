// 🗺️ Maps Integration Component - OpenStreetMap + Backend Integration
import React, { useState, useEffect } from 'react';
import OpenStreetMap, { OpenStreetMapBusiness } from './OpenStreetMap';
import '../src/styles/openstreetmap.css';

// Helper function for height classes
const getHeightClass = (height: string): string => {
  switch (height) {
    case '400px': return 'map-height-400';
    case '500px': return 'map-height-500';
    case '600px': return 'map-height-600';
    case '700px': return 'map-height-700';
    default: return '';
  }
};

// Import istniejących typów z projektu
interface Business {
  _id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  isOpen?: boolean;
  owner: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
}

interface MapsIntegrationProps {
  businesses?: Business[];
  onBusinessSelect?: (business: Business) => void;
  height?: string;
  showUserLocation?: boolean;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

// Convert backend Business to OpenStreetMap format
const convertToMapBusiness = (business: Business): OpenStreetMapBusiness => {
  return {
    id: business._id,
    name: business.name,
    category: business.category,
    description: business.description,
    address: business.address,
    coordinates: business.coordinates || { lat: 52.3676, lng: 4.9041 }, // Amsterdam default
    rating: business.rating,
    isOpen: business.isOpen
  };
};

// Sample mock data for demonstration
const sampleBusinesses: Business[] = [
  {
    _id: '1',
    name: 'Café Amsterdam',
    category: 'cafes',
    description: 'Cozy café with the best coffee in town. Perfect for morning meetings or relaxing afternoons.',
    address: 'Damrak 75, 1012 LM Amsterdam',
    coordinates: { lat: 52.3738, lng: 4.8910 },
    rating: 4.5,
    isOpen: true,
    owner: 'owner1'
  },
  {
    _id: '2',
    name: 'Restaurant De Kas',
    category: 'restaurants',
    description: 'Fine dining restaurant with fresh, locally sourced ingredients. Greenhouse setting.',
    address: 'Kamerlingh Onneslaan 3, 1097 DE Amsterdam',
    coordinates: { lat: 52.3565, lng: 4.9206 },
    rating: 4.8,
    isOpen: true,
    owner: 'owner2'
  },
  {
    _id: '3',
    name: 'Bike Repair Shop',
    category: 'services',
    description: 'Professional bicycle repair and maintenance services. Quick and reliable.',
    address: 'Nieuwendijk 120, 1012 MR Amsterdam',
    coordinates: { lat: 52.3727, lng: 4.8936 },
    rating: 4.2,
    isOpen: false,
    owner: 'owner3'
  },
  {
    _id: '4',
    name: 'Albert Heijn',
    category: 'shops',
    description: 'Supermarket with fresh groceries, daily essentials, and local products.',
    address: 'Nieuwmarkt 18, 1012 CR Amsterdam',
    coordinates: { lat: 52.3719, lng: 4.9006 },
    rating: 4.0,
    isOpen: true,
    owner: 'owner4'
  },
  {
    _id: '5',
    name: 'Amsterdam Medical Center',
    category: 'healthcare',
    description: 'Complete healthcare services with experienced medical professionals.',
    address: 'Meibergdreef 9, 1105 AZ Amsterdam',
    coordinates: { lat: 52.3547, lng: 4.9633 },
    rating: 4.3,
    isOpen: true,
    owner: 'owner5'
  }
];

const MapsIntegration: React.FC<MapsIntegrationProps> = ({
  businesses = sampleBusinesses,
  onBusinessSelect,
  height = '500px',
  showUserLocation = true,
  className = '',
  center = [52.3676, 4.9041], // Amsterdam
  zoom = 12
}) => {
  const [mapBusinesses, setMapBusinesses] = useState<OpenStreetMapBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert businesses to map format
  useEffect(() => {
    try {
      const converted = businesses.map(convertToMapBusiness);
      setMapBusinesses(converted);
      setLoading(false);
    } catch (err) {
      setError('Failed to load businesses');
      setLoading(false);
    }
  }, [businesses]);

  // Handle business selection
  const handleBusinessClick = (mapBusiness: OpenStreetMapBusiness) => {
    // Find original business object
    const originalBusiness = businesses.find(b => b._id === mapBusiness.id);
    if (originalBusiness && onBusinessSelect) {
      onBusinessSelect(originalBusiness);
    }
  };

  // Fetch businesses from backend (optional - can be enabled later)
  const fetchBusinessesFromBackend = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8080/api/business');
      if (response.ok) {
        const data = await response.json();
        // Convert and set businesses
        const converted = data.businesses?.map(convertToMapBusiness) || [];
        setMapBusinesses(converted);
      }
    } catch (err) {
      console.warn('Could not fetch businesses from backend, using sample data');
      // Fallback to sample data
      const converted = sampleBusinesses.map(convertToMapBusiness);
      setMapBusinesses(converted);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`map-loading-container ${getHeightClass(height)} ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`map-error-container ${getHeightClass(height)} ${className}`}>
        <div className="text-center text-red-600">
          <p className="font-semibold">⚠️ Error loading map</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`maps-integration ${className}`}>
      {/* Map Statistics */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          📍 {mapBusinesses.length} businesses
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
          🟢 {mapBusinesses.filter(b => b.isOpen).length} open
        </div>
        <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
          🔴 {mapBusinesses.filter(b => !b.isOpen).length} closed
        </div>
        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
          🗺️ OpenStreetMap
        </div>
      </div>

      {/* Main Map */}
      <OpenStreetMap
        businesses={mapBusinesses}
        center={center}
        zoom={zoom}
        height={height}
        onBusinessClick={handleBusinessClick}
        showUserLocation={showUserLocation}
        className="rounded-lg shadow-lg border"
      />

      {/* Map Controls */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            // Center on Amsterdam
            window.location.reload(); // Simple reload to reset map
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          🏠 Reset View
        </button>
        
        <button
          onClick={fetchBusinessesFromBackend}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
        >
          🔄 Refresh Data
        </button>

        <button
          onClick={() => {
            const osmUrl = 'https://www.openstreetmap.org/#map=12/52.3676/4.9041';
            window.open(osmUrl, '_blank');
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
        >
          🌐 Open in OSM
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">🗺️ OpenStreetMap Features:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ <strong>100% Free:</strong> No API keys, no limits, no costs</li>
          <li>✅ <strong>Interactive:</strong> Click markers for business details</li>
          <li>✅ <strong>User Location:</strong> Blue dot shows your current location</li>
          <li>✅ <strong>Directions:</strong> Click "Directions" button for navigation</li>
          <li>✅ <strong>Real-time:</strong> Business status (open/closed) updates</li>
          <li>✅ <strong>Categories:</strong> Different icons for different business types</li>
        </ul>
      </div>
    </div>
  );
};

export default MapsIntegration;
export type { Business, MapsIntegrationProps };