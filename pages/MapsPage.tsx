import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GoogleMap, { BusinessMarkerData } from '../components/maps/GoogleMap';
import LocationFilter from '../components/maps/LocationFilter';
import GeolocationButton from '../components/maps/GeolocationButton';
import { ClusterControls, ClusteringProvider } from '../components/maps/clustering';
import { RouteProvider } from '../components/maps/directions';
import { useMaps } from '../src/hooks/useMaps';
import { ExclamationTriangleIcon, MagnifyingGlassIcon, MapIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MapsPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    // State
    userLocation,
    isLocationLoading,
    locationError,
    nearbyBusinesses,
    isSearchLoading,
    searchError,
    hasLocationPermission,
    mapCenter,
    mapZoom,
    selectedBusiness,
    
    // Actions
    getCurrentLocation,
    searchNearby,
    clearSearch,
    setMapCenter,
    setMapZoom,
    selectBusiness
  } = useMaps();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDistance, setSelectedDistance] = useState<number>(5);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessMarkerData[]>([]);
  const [showError, setShowError] = useState(true);
  
  // Clustering state
  const [clusteringEnabled, setClusteringEnabled] = useState<boolean>(true);
  const [clusterGridSize, setClusterGridSize] = useState<number>(60);
  const [clusterAlgorithm, setClusterAlgorithm] = useState<'grid' | 'kmeans' | 'supercluster'>('grid');

  // Convert API business data to marker format
  useEffect(() => {
    const markers: BusinessMarkerData[] = nearbyBusinesses.map(business => ({
      id: business.id,
      name: business.business.name,
      position: business.position,
      category: business.business.category,
      rating: business.business.rating || 0,
      isOpen: business.business.isOpen,
      address: business.address,
      phone: business.business.phone,
      website: business.business.website
    }));

    setFilteredBusinesses(markers);
  }, [nearbyBusinesses]);

  // Auto-search when location or filters change
  useEffect(() => {
    if (userLocation) {
      searchNearby({
        radius: selectedDistance * 1000, // Convert km to meters
        category: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
        limit: 50
      });
    }
  }, [userLocation, selectedDistance, selectedCategories, searchNearby]);

  const handleLocationUpdate = async () => {
    setShowError(true);
    await getCurrentLocation();
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleBusinessSelect = (business: BusinessMarkerData | null) => {
    if (business) {
      // Find the original business data to get distance and verification
      const originalBusiness = nearbyBusinesses.find(b => b.id === business.id);
      
      selectBusiness({
        id: business.id,
        name: business.name,
        position: business.position,
        address: business.address || '',
        distance: originalBusiness?.distance || 0,
        business: {
          id: business.id,
          name: business.name,
          category: business.category,
          rating: business.rating || 0,
          isVerified: originalBusiness?.business.isVerified || false,
          phone: business.phone,
          website: business.website,
          isOpen: business.isOpen || false
        }
      });
    } else {
      selectBusiness(null);
    }
  };

  const handleRetryLocation = () => {
    setShowError(false);
    handleLocationUpdate();
  };

  const handleRetrySearch = () => {
    if (userLocation) {
      searchNearby({
        radius: selectedDistance * 1000,
        category: selectedCategories.length === 1 ? selectedCategories[0] : undefined
      });
    }
  };

  const dismissError = () => {
    setShowError(false);
  };

  return (
    <ClusteringProvider
      initialEnabled={clusteringEnabled}
      initialAlgorithm={clusterAlgorithm}
      initialGridSize={clusterGridSize}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('maps.title', 'Kaart & Locaties')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {nearbyBusinesses.length > 0 
                    ? t('maps.businessesFound', '{{count}} bedrijven gevonden', { count: nearbyBusinesses.length })
                    : t('maps.findBusinesses', 'Vind bedrijven in de buurt')
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <GeolocationButton
                onLocationUpdate={({ lat, lng }) => setMapCenter({ lat, lng })}
                onLocationError={(error) => console.error('Location error:', error)}
                autoLocate={!userLocation}
                showStatus={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {showError && (locationError || searchError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {locationError ? t('maps.locationError', 'Locatiefout') : t('maps.searchError', 'Zoekfout')}
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{locationError || searchError}</p>
                </div>
                <div className="mt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={locationError ? handleRetryLocation : handleRetrySearch}
                      className="bg-red-100 dark:bg-red-900/40 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                    >
                      {t('common.retry', 'Opnieuw proberen')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={dismissError}
              className="flex-shrink-0 ml-4"
              title={t('common.dismiss', 'Sluiten')}
              aria-label={t('common.dismiss', 'Sluiten')}
            >
              <XMarkIcon className="h-5 w-5 text-red-400 hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <LocationFilter
                onDistanceChange={setSelectedDistance}
                onCategoryChange={setSelectedCategories}
                userLocation={userLocation}
                maxDistance={50}
              />
            </div>

            {/* Clustering Controls */}
            <div className="mt-4">
              <ClusterControls
                isEnabled={clusteringEnabled}
                onToggle={setClusteringEnabled}
                gridSize={clusterGridSize}
                onGridSizeChange={setClusterGridSize}
                algorithm={clusterAlgorithm}
                onAlgorithmChange={setClusterAlgorithm}
                compact={true}
              />
            </div>

            {/* Search Status */}
            {isSearchLoading && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center">
                  <MagnifyingGlassIcon className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="ml-2 text-sm text-blue-800 dark:text-blue-200">
                    {t('maps.searching', 'Zoeken naar bedrijven...')}
                  </span>
                </div>
              </div>
            )}

            {/* No Results */}
            {!isSearchLoading && nearbyBusinesses.length === 0 && userLocation && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  {t('maps.noResults', 'Geen bedrijven gevonden')}
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {t('maps.tryDifferentFilters', 'Probeer andere filters of vergroot de zoekradius')}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedDistance(10);
                  }}
                  className="mt-2 text-xs text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                >
                  {t('maps.clearFilters', 'Wis filters')}
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <RouteProvider>
                <GoogleMap
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'your-api-key-here'}
                  businesses={filteredBusinesses}
                  showUserLocation={!!userLocation}
                  center={mapCenter}
                  zoom={mapZoom}
                  enableClustering={clusteringEnabled}
                  clusterGridSize={clusterGridSize}
                  clusterAlgorithm={clusterAlgorithm}
                  enableDirections={true}
                  showRouteControls={true}
                  showRoutePanel={true}
                  onClusterClick={(cluster) => {
                    console.log('Cluster clicked:', cluster);
                    // TODO: Show cluster info window
                  }}
                  onBusinessSelect={(business) => {
                    console.log('Business selected for directions:', business);
                    selectBusiness(business as any);
                  }}
                />
              </RouteProvider>
            </div>

            {/* Map Stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {nearbyBusinesses.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('maps.businessesFound', 'Bedrijven')}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {nearbyBusinesses.filter(b => b.business.isVerified).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('maps.verified', 'Geverifieerd')}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {filteredBusinesses.filter(b => b.isOpen).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('maps.openNow', 'Nu open')}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {selectedDistance}km
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('maps.radius', 'Straal')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ClusteringProvider>
  );
};

export default MapsPage;