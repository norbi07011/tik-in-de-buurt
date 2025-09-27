import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GoogleMap, { BusinessMarkerData } from '../components/maps/GoogleMap';
import LocationFilter from '../components/maps/LocationFilter';
import GeolocationButton from '../components/maps/GeolocationButton';
import { useMaps } from '../src/hooks/useMaps';
import { ExclamationTriangleIcon, MagnifyingGlassIcon, MapIcon } from '@heroicons/react/24/outline';

// 🗺️ Types
interface UserLocation {
  lat: number;
  lng: number;
}

interface MapPageState {
  userLocation: UserLocation | null;
  selectedDistance: number;
  selectedCategories: string[];
  businesses: BusinessMarkerData[];
  filteredBusinesses: BusinessMarkerData[];
  loading: boolean;
  error: string | null;
}

// 🏢 Mock business data for demonstration
const MOCK_BUSINESSES: BusinessMarkerData[] = [
  {
    id: '1',
    name: 'Pizza Palace',
    position: { lat: 52.3676, lng: 4.9041 },
    category: 'restaurant',
    rating: 4.5,
    isOpen: true,
    address: 'Dam Square 1, Amsterdam',
    phone: '+31 20 123 4567'
  },
  {
    id: '2',
    name: 'Tech Store Amsterdam',
    position: { lat: 52.3702, lng: 4.8952 },
    category: 'retail',
    rating: 4.2,
    isOpen: true,
    address: 'Kalverstraat 92, Amsterdam'
  },
  {
    id: '3',
    name: 'City Medical Center',
    position: { lat: 52.3612, lng: 4.8897 },
    category: 'healthcare',
    rating: 4.8,
    isOpen: false,
    address: 'Vondelpark 3, Amsterdam',
    phone: '+31 20 987 6543'
  },
  {
    id: '4',
    name: 'Amsterdam Fitness',
    position: { lat: 52.3740, lng: 4.8896 },
    category: 'fitness',
    rating: 4.0,
    isOpen: true,
    address: 'Museumplein 6, Amsterdam'
  },
  {
    id: '5',
    name: 'Cafe Central',
    position: { lat: 52.3630, lng: 4.8936 },
    category: 'restaurant',
    rating: 4.3,
    isOpen: true,
    address: 'Leidseplein 12, Amsterdam'
  },
  {
    id: '6', 
    name: 'Beauty Salon Elite',
    position: { lat: 52.3584, lng: 4.8614 },
    category: 'beauty',
    rating: 4.7,
    isOpen: true,
    address: 'Jordaan District, Amsterdam'
  }
];

const MapsPage: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<MapPageState>({
    userLocation: null,
    selectedDistance: 5,
    selectedCategories: [],
    businesses: MOCK_BUSINESSES,
    filteredBusinesses: MOCK_BUSINESSES,
    loading: false,
    error: null
  });

  // 🧮 Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // 🔍 Filter businesses based on location and criteria
  const filterBusinesses = useCallback(() => {
    let filtered = [...state.businesses];

    // Filter by distance if user location is available
    if (state.userLocation) {
      filtered = filtered.filter(business => {
        const distance = calculateDistance(
          state.userLocation!.lat,
          state.userLocation!.lng,
          business.position.lat,
          business.position.lng
        );
        return distance <= state.selectedDistance;
      });
    }

    // Filter by categories
    if (state.selectedCategories.length > 0) {
      filtered = filtered.filter(business => 
        state.selectedCategories.includes(business.category)
      );
    }

    setState(prev => ({ ...prev, filteredBusinesses: filtered }));
  }, [state.businesses, state.userLocation, state.selectedDistance, state.selectedCategories, calculateDistance]);

  // 🧭 Handle location update
  const handleLocationUpdate = useCallback((location: UserLocation) => {
    setState(prev => ({ ...prev, userLocation: location, error: null }));
  }, []);

  // ❌ Handle location error
  const handleLocationError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, userLocation: null }));
  }, []);

  // 📏 Handle distance change
  const handleDistanceChange = useCallback((distance: number) => {
    setState(prev => ({ ...prev, selectedDistance: distance }));
  }, []);

  // 🏷️ Handle category change
  const handleCategoryChange = useCallback((categories: string[]) => {
    setState(prev => ({ ...prev, selectedCategories: categories }));
  }, []);

  // 📍 Handle map location select
  const handleMapLocationSelect = useCallback((location: UserLocation) => {
    setState(prev => ({ ...prev, userLocation: location }));
    console.log('Selected location:', location);
  }, []);

  // 🗺️ Handle map load
  const handleMapLoad = useCallback((map: any) => {
    console.log('Map loaded:', map);
  }, []);

  // 🔄 Update filters when dependencies change
  useEffect(() => {
    filterBusinesses();
  }, [filterBusinesses]);

  // 🎮 Get Google Maps API key (in production, this should be in environment variables)
  const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with actual API key

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 📱 Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🗺️ {t('Explore Local Businesses')}
              </h1>
              <p className="text-sm text-gray-600">
                Discover businesses and services near you
              </p>
            </div>
            
            {/* 📊 Results counter */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{state.filteredBusinesses.length}</span>
                {' '} of {state.businesses.length} businesses
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 Error Banner */}
      {state.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎛️ Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 🔧 Sidebar - Filters & Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 🧭 Geolocation Control */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-800 mb-3">📍 Your Location</h3>
              <GeolocationButton
                onLocationUpdate={handleLocationUpdate}
                onLocationError={handleLocationError}
                autoLocate={true}
                showStatus={true}
              />
            </div>

            {/* 🔍 Location Filters */}
            <LocationFilter
              onDistanceChange={handleDistanceChange}
              onCategoryChange={handleCategoryChange}
              userLocation={state.userLocation}
              maxDistance={50}
            />

            {/* 📊 Business Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-800 mb-3">📈 Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Businesses:</span>
                  <span className="font-medium">{state.businesses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Filtered Results:</span>
                  <span className="font-medium text-blue-600">{state.filteredBusinesses.length}</span>
                </div>
                {state.userLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Search Radius:</span>
                    <span className="font-medium">{state.selectedDistance} km</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Now:</span>
                  <span className="font-medium text-green-600">
                    {state.filteredBusinesses.filter(b => b.isOpen).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🗺️ Main Map Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              
              {/* 🗺️ Google Map */}
              <GoogleMap
                apiKey={GOOGLE_MAPS_API_KEY}
                center={state.userLocation || { lat: 52.3676, lng: 4.9041 }}
                zoom={state.userLocation ? 14 : 12}
                businesses={state.filteredBusinesses}
                showUserLocation={true}
                onMapLoad={handleMapLoad}
                onLocationSelect={handleMapLocationSelect}
                className="w-full h-96 lg:h-[600px]"
              />

              {/* 📋 Business List */}
              <div className="p-4 border-t bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-4">
                  📋 Nearby Businesses ({state.filteredBusinesses.length})
                </h3>
                
                {state.filteredBusinesses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="font-medium">No businesses found</p>
                    <p className="text-sm">Try adjusting your filters or location</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.filteredBusinesses.map((business) => (
                      <div
                        key={business.id}
                        className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{business.name}</h4>
                          <div className="flex items-center gap-2">
                            {business.rating && (
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500 text-sm">★</span>
                                <span className="text-sm font-medium">{business.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {business.address && (
                          <p className="text-sm text-gray-600 mb-2">📍 {business.address}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`
                              px-2 py-1 text-xs rounded-full
                              ${business.isOpen 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                              }
                            `}>
                              {business.isOpen ? 'Open' : 'Closed'}
                            </span>
                            
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                              {business.category}
                            </span>
                          </div>

                          {state.userLocation && (
                            <span className="text-xs text-gray-500">
                              {calculateDistance(
                                state.userLocation.lat,
                                state.userLocation.lng, 
                                business.position.lat,
                                business.position.lng
                              ).toFixed(1)} km away
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapsPage;