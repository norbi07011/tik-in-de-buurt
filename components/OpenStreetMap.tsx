// 🗺️ OpenStreetMap Main Component
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types
interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  rating?: number;
  isOpen?: boolean;
}

interface OpenStreetMapProps {
  businesses: Business[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onBusinessClick?: (business: Business) => void;
  showUserLocation?: boolean;
  className?: string;
}

// Custom marker icons for different business categories
const createBusinessIcon = (category: string, isOpen: boolean = true) => {
  const iconColor = isOpen ? '#10B981' : '#EF4444'; // green if open, red if closed
  
  const categoryIcons: Record<string, string> = {
    restaurants: '🍽️',
    cafes: '☕',
    shops: '🛍️',
    services: '🔧',
    healthcare: '🏥',
    entertainment: '🎬',
    default: '📍'
  };

  const iconHtml = `
    <div style="
      background: ${iconColor};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      font-size: 16px;
    ">
      ${categoryIcons[category] || categoryIcons.default}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-business-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// User location marker
const createUserIcon = () => {
  const userIconHtml = `
    <div style="
      background: #3B82F6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      animation: pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    </style>
  `;

  return L.divIcon({
    html: userIconHtml,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// User Location Component
const UserLocationMarker: React.FC = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          // Center map on user location
          map.setView([latitude, longitude], 13);
        },
        (error) => {
          console.warn('Could not get user location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        }
      );
    }
  }, [map]);

  return position ? (
    <Marker position={position} icon={createUserIcon()}>
      <Popup>
        <div className="text-center">
          <div className="font-semibold text-blue-600">📍 Your Location</div>
          <div className="text-sm text-gray-600 mt-1">
            Lat: {position[0].toFixed(6)}<br/>
            Lng: {position[1].toFixed(6)}
          </div>
        </div>
      </Popup>
    </Marker>
  ) : null;
};

// Map Events Handler
const MapEventsHandler: React.FC<{ onMapClick?: (latlng: L.LatLng) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

// Main OpenStreetMap Component
const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  businesses = [],
  center = [52.3676, 4.9041], // Amsterdam center as default
  zoom = 12,
  height = '400px',
  onBusinessClick,
  showUserLocation = true,
  className = ''
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
    if (onBusinessClick) {
      onBusinessClick(business);
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    console.log('Map clicked at:', latlng.lat, latlng.lng);
    // You can add custom functionality here (e.g., add new business)
  };

  return (
    <div className={`openstreetmap-container ${getHeightClass(height)} ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        {/* Base Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* User Location */}
        {showUserLocation && <UserLocationMarker />}

        {/* Business Markers */}
        {businesses.map((business) => (
          <Marker
            key={business.id}
            position={[business.coordinates.lat, business.coordinates.lng]}
            icon={createBusinessIcon(business.category, business.isOpen)}
            eventHandlers={{
              click: () => handleBusinessClick(business),
            }}
          >
            <Popup>
              <div className="business-popup max-w-xs">
                <div className="font-semibold text-lg text-gray-800 mb-2">
                  {business.name}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {business.category}
                    </span>
                    {business.isOpen !== undefined && (
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        business.isOpen 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {business.isOpen ? '🟢 Open' : '🔴 Closed'}
                      </span>
                    )}
                  </div>

                  {business.rating && (
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium">{business.rating.toFixed(1)}</span>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {business.description}
                  </p>

                  <div className="text-xs text-gray-500 border-t pt-2">
                    📍 {business.address}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button 
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                      onClick={() => {
                        // Get directions using OpenStreetMap
                        const directionsUrl = `https://www.openstreetmap.org/directions?from=&to=${business.coordinates.lat},${business.coordinates.lng}`;
                        window.open(directionsUrl, '_blank');
                      }}
                    >
                      🧭 Directions
                    </button>
                    <button 
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                      onClick={() => handleBusinessClick(business)}
                    >
                      ℹ️ Details
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Map Events */}
        <MapEventsHandler onMapClick={handleMapClick} />
      </MapContainer>

      {/* Selected Business Info Panel */}
      {selectedBusiness && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-[1000]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{selectedBusiness.name}</h3>
            <button 
              onClick={() => setSelectedBusiness(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">{selectedBusiness.description}</p>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Category:</span> {selectedBusiness.category}
            </div>
            <div className="text-sm">
              <span className="font-medium">Address:</span> {selectedBusiness.address}
            </div>
            {selectedBusiness.rating && (
              <div className="text-sm">
                <span className="font-medium">Rating:</span> ⭐ {selectedBusiness.rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenStreetMap;
export type { Business as OpenStreetMapBusiness };