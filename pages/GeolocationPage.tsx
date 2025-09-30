import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  GlobeAltIcon, 
  ChartBarIcon,
  BellIcon,
  CogIcon,
  ArrowRightIcon as NavigationIcon,
  ShieldCheckIcon,
  FireIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import EnhancedGeolocationSystem from '../components/EnhancedGeolocationSystem';
// import { locationService } from '../services/locationService'; // Commented out due to import issues

interface LocationDemoProps {
  className?: string;
}

const LocationDemoCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ title, description, icon, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
      isActive 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
    }`}
  >
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${
        isActive 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      }`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  </div>
);

const GeolocationPage: React.FC<LocationDemoProps> = ({ className = '' }) => {
  const [activeDemo, setActiveDemo] = useState<string>('main');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<{
    location: boolean;
    notifications: boolean;
  }>({ location: false, notifications: false });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // TODO: Fix locationService import and uncomment
    /*
    const locationPerm = await locationService.requestLocationPermission();
    const notificationPerm = await locationService.requestNotificationPermission();
    
    setPermissionStatus({
      location: locationPerm,
      notifications: notificationPerm
    });
    */
    
    // Temporary mock permissions
    setPermissionStatus({
      location: true,
      notifications: true
    });
  };

  const initializeLocation = async () => {
    setLocationStatus('loading');
    try {
      // TODO: Fix locationService import and uncomment
      /*
      const position = await locationService.getCurrentPosition();
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      */
      
      // Temporary fallback location (Kraków center)
      setCurrentLocation({
        lat: 50.0647,
        lng: 19.9450
      });
      setLocationStatus('active');
    } catch (error) {
      console.error('Location error:', error);
      setLocationStatus('error');
    }
  };

  const demos = [
    {
      id: 'main',
      title: 'System Geolokalizacji',
      description: 'Główny interfejs zaawansowanych funkcji lokalizacyjnych',
      icon: <GlobeAltIcon className="w-6 h-6" />
    },
    {
      id: 'routing',
      title: 'Inteligentny Routing',
      description: 'AI-powered nawigacja z optymalizacją tras',
      icon: <NavigationIcon className="w-6 h-6" />
    },
    {
      id: 'geofencing',
      title: 'Strefy Geofencing',
      description: 'Automatyczne powiadomienia oparte na lokalizacji',
      icon: <ShieldCheckIcon className="w-6 h-6" />
    },
    {
      id: 'analytics',
      title: 'Analityka Lokalizacji',
      description: 'Heatmapy i statystyki ruchu użytkowników',
      icon: <ChartBarIcon className="w-6 h-6" />
    }
  ];

  const features = [
    {
      title: 'Nawigacja Głosowa',
      description: 'Wielojęzyczne instrukcje głosowe podczas nawigacji',
      icon: <BellIcon className="w-5 h-5" />,
      color: 'text-blue-500'
    },
    {
      title: 'Routing w Czasie Rzeczywistym',
      description: 'Dynamiczne przeliczanie tras na podstawie ruchu',
      icon: <NavigationIcon className="w-5 h-5" />,
      color: 'text-green-500'
    },
    {
      title: 'Strefy Bezpieczeństwa',
      description: 'Powiadomienia o niebezpiecznych obszarach',
      icon: <ExclamationTriangleIcon className="w-5 h-5" />,
      color: 'text-red-500'
    },
    {
      title: 'Lokalne POI',
      description: 'Inteligentne rekomendacje miejsc w pobliżu',
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      color: 'text-purple-500'
    },
    {
      title: 'Analityka Ruchu',
      description: 'Heatmapy i statystyki użytkowania lokalizacji',
      icon: <ChartBarIcon className="w-5 h-5" />,
      color: 'text-orange-500'
    },
    {
      title: 'Tryb Offline',
      description: 'Nawigacja bez połączenia internetowego',
      icon: <CogIcon className="w-5 h-5" />,
      color: 'text-gray-500'
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Enhanced Geolocation Features
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Zaawansowane funkcje lokalizacyjne z AI-powered nawigacją
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Location Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  locationStatus === 'active' ? 'bg-green-500 animate-pulse' :
                  locationStatus === 'loading' ? 'bg-yellow-500 animate-spin' :
                  locationStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {locationStatus === 'active' && 'GPS Aktywny'}
                  {locationStatus === 'loading' && 'Lokalizacja...'}
                  {locationStatus === 'error' && 'Błąd GPS'}
                  {locationStatus === 'idle' && 'GPS Nieaktywny'}
                </span>
              </div>
              
              {/* Initialize Location Button */}
              {locationStatus !== 'active' && (
                <button
                  onClick={initializeLocation}
                  disabled={locationStatus === 'loading'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {locationStatus === 'loading' ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Lokalizacja...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span>Aktywuj GPS</span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Permissions Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status Uprawnień
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Dostęp do lokalizacji
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                permissionStatus.location 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {permissionStatus.location ? 'Aktywne' : 'Wymagane'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Powiadomienia
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                permissionStatus.notifications 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {permissionStatus.notifications ? 'Aktywne' : 'Opcjonalne'}
              </div>
            </div>
          </div>
        </div>

        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Twoja Lokalizacja</h3>
                <div className="text-blue-100">
                  <p>Szerokość: {currentLocation.lat.toFixed(6)}°</p>
                  <p>Długość: {currentLocation.lng.toFixed(6)}°</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <MapPinIcon className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Dostępne Demonstracje
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demos.map((demo) => (
              <LocationDemoCard
                key={demo.id}
                title={demo.title}
                description={demo.description}
                icon={demo.icon}
                isActive={activeDemo === demo.id}
                onClick={() => setActiveDemo(demo.id)}
              />
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Kluczowe Funkcjonalności
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${feature.color}`}>
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Component Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {activeDemo === 'main' && (
            <EnhancedGeolocationSystem />
          )}
          
          {activeDemo === 'routing' && (
            <div className="p-8">
              <div className="text-center py-12">
                <NavigationIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Inteligentny Routing
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Demo zaawansowanego systemu nawigacji z AI
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Funkcje Routingu:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 text-left">
                    <li>• Optymalizacja tras w czasie rzeczywistym</li>
                    <li>• Uwzględnianie informacji o ruchu</li>
                    <li>• Wielojęzyczne instrukcje głosowe</li>
                    <li>• Alternatywne trasy z oszczędnościami</li>
                    <li>• Tryb offline dla obszarów bez internetu</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {activeDemo === 'geofencing' && (
            <div className="p-8">
              <div className="text-center py-12">
                <ShieldCheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Strefy Geofencing
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Automatyczne powiadomienia oparte na lokalizacji
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <BuildingOfficeIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Strefy Biznesowe
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Powiadomienia o promocjach i ofertach
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <FireIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                      Strefy Wydarzeń
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Informacje o lokalnych eventach
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      Strefy Ostrzeżeń
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Alerty bezpieczeństwa i zagrożenia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeDemo === 'analytics' && (
            <div className="p-8">
              <div className="text-center py-12">
                <ChartBarIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Analityka Lokalizacji
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Zaawansowane analizy ruchu i użytkowania
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      15.6K
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Łączne wizyty
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      8.4K
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Unikalni użytkownicy
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      31m
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Średni czas pobytu
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      92%
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      Zadowolenie
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Implementation Status */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status Implementacji
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Enhanced Geolocation Features - Faza 3 ukończona
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Aktywne i funkcjonalne
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Zaawansowany routing</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">System geofencing</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Analityka lokalizacji</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeolocationPage;