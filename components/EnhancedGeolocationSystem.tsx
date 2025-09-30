import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPinIcon, 
  GlobeAltIcon as CompassIcon, 
  BellIcon, 
  ClockIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  SignalIcon as TrafficLightIcon,
  FireIcon,
  BuildingOfficeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
// import { locationService } from '../services/locationService'; // Commented out due to import issues

interface RouteStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  coordinates: [number, number];
  streetName: string;
  turnDirection?: 'left' | 'right' | 'straight' | 'u-turn';
}

interface GeofenceZone {
  id: string;
  name: string;
  type: 'circular' | 'polygon';
  center?: [number, number];
  radius?: number;
  polygon?: [number, number][];
  category: 'business' | 'event' | 'danger' | 'parking' | 'poi';
  notifications: boolean;
  customMessage?: string;
  activeHours?: {
    start: string;
    end: string;
    days: string[];
  };
}

interface LocationAnalytics {
  totalVisits: number;
  uniqueUsers: number;
  averageStayTime: number;
  popularTimes: {
    hour: number;
    visits: number;
  }[];
  heatmapData: {
    lat: number;
    lng: number;
    intensity: number;
  }[];
  demographics: {
    ageGroups: Record<string, number>;
    interests: Record<string, number>;
  };
}

interface EnhancedGeolocationSystemProps {
  className?: string;
}

const EnhancedGeolocationSystem: React.FC<EnhancedGeolocationSystemProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'routing' | 'geofencing' | 'analytics' | 'settings'>('routing');
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<string>('');
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>([]);
  const [analytics, setAnalytics] = useState<LocationAnalytics | null>(null);
  const [language, setLanguage] = useState<'pl' | 'en' | 'de' | 'uk'>('pl');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [routeMode, setRouteMode] = useState<'driving' | 'walking' | 'cycling' | 'transit'>('driving');
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  // Initialize geolocation and default geofences
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // TODO: Fix locationService import and uncomment
        /*
        const position = await locationService.getCurrentPosition();
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        */
        
        // Temporary fallback location (Kraków center)
        setCurrentLocation([50.0647, 19.9450]);
        
        // Initialize default geofence zones
        const defaultZones: GeofenceZone[] = [
          {
            id: 'centrum-krakow',
            name: 'Centrum Krakowa',
            type: 'circular',
            center: [50.0647, 19.9450],
            radius: 1000,
            category: 'poi',
            notifications: true,
            customMessage: 'Witaj w centrum Krakowa! Odkryj lokalne atrakcje.',
            activeHours: {
              start: '08:00',
              end: '20:00',
              days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
            }
          },
          {
            id: 'stare-miasto',
            name: 'Stare Miasto',
            type: 'polygon',
            polygon: [
              [50.0692, 19.9281],
              [50.0656, 19.9463],
              [50.0599, 19.9394],
              [50.0635, 19.9212]
            ],
            category: 'poi',
            notifications: true,
            customMessage: 'Jesteś w zabytkowym Starym Mieście!'
          },
          {
            id: 'parking-galeria',
            name: 'Strefa Parkingowa - Galeria',
            type: 'circular',
            center: [50.0628, 19.9378],
            radius: 200,
            category: 'parking',
            notifications: true,
            customMessage: 'Dostępne miejsca parkingowe w pobliżu.'
          }
        ];
        
        setGeofenceZones(defaultZones);
        
        // TODO: Fix locationService import and uncomment
        /*
        // Load analytics data
        const analyticsData = await locationService.getLocationAnalytics();
        setAnalytics(analyticsData);
        */
        
      } catch (error) {
        console.error('Error initializing location:', error);
      }
    };

    initializeLocation();
  }, []);

  const calculateRoute = async () => {
    if (!destination.trim() || !currentLocation) return;
    
    setLoading(true);
    try {
      // TODO: Fix locationService import and uncomment
      /*
      const route = await locationService.calculateRoute(currentLocation, destination, {
        mode: routeMode,
        language,
        avoidTraffic: trafficEnabled,
        alternatives: true
      });
      
      setRouteSteps(route.steps);
      */
      
      // Temporary mock route steps
      const mockSteps: RouteStep[] = [
        {
          id: '1',
          instruction: 'Idź prosto ulicą Główną',
          distance: 500,
          duration: 300,
          maneuver: 'continue',
          coordinates: [currentLocation[0], currentLocation[1]],
          streetName: 'ul. Główna',
          turnDirection: 'straight'
        }
      ];
      setRouteSteps(mockSteps);
      
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
    if (voiceEnabled) {
      // Initialize text-to-speech for navigation
      const utterance = new SpeechSynthesisUtterance(
        language === 'pl' ? 'Rozpoczynamy nawigację' : 'Starting navigation'
      );
      utterance.lang = language === 'pl' ? 'pl-PL' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const addGeofenceZone = () => {
    const newZone: GeofenceZone = {
      id: `zone-${Date.now()}`,
      name: 'Nowa strefa',
      type: 'circular',
      center: currentLocation || [50.0647, 19.9450],
      radius: 500,
      category: 'business',
      notifications: true
    };
    setGeofenceZones([...geofenceZones, newZone]);
  };

  const removeGeofenceZone = (zoneId: string) => {
    setGeofenceZones(geofenceZones.filter(zone => zone.id !== zoneId));
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getCategoryIcon = (category: GeofenceZone['category']) => {
    switch (category) {
      case 'business':
        return <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />;
      case 'event':
        return <FireIcon className="w-5 h-5 text-orange-500" />;
      case 'danger':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'parking':
        return <TrafficLightIcon className="w-5 h-5 text-green-500" />;
      default:
        return <MapPinIcon className="w-5 h-5 text-purple-500" />;
    }
  };

  const getRouteModeIcon = (mode: typeof routeMode) => {
    switch (mode) {
      case 'driving':
        return '🚗';
      case 'walking':
        return '🚶';
      case 'cycling':
        return '🚴';
      case 'transit':
        return '🚌';
      default:
        return '🚗';
    }
  };

  const translations = {
    pl: {
      routing: 'Nawigacja',
      geofencing: 'Strefy',
      analytics: 'Analityka',
      settings: 'Ustawienia',
      destination: 'Cel podróży',
      startNavigation: 'Rozpocznij nawigację',
      stopNavigation: 'Zatrzymaj nawigację',
      calculateRoute: 'Oblicz trasę',
      addZone: 'Dodaj strefę',
      removeZone: 'Usuń strefę',
      totalVisits: 'Łączne wizyty',
      uniqueUsers: 'Unikalni użytkownicy',
      averageStay: 'Średni czas pobytu',
      language: 'Język',
      voiceNavigation: 'Nawigacja głosowa',
      offlineMode: 'Tryb offline',
      trafficInfo: 'Informacje o ruchu',
      routeMode: 'Sposób podróży'
    },
    en: {
      routing: 'Routing',
      geofencing: 'Geofencing',
      analytics: 'Analytics',
      settings: 'Settings',
      destination: 'Destination',
      startNavigation: 'Start Navigation',
      stopNavigation: 'Stop Navigation',
      calculateRoute: 'Calculate Route',
      addZone: 'Add Zone',
      removeZone: 'Remove Zone',
      totalVisits: 'Total Visits',
      uniqueUsers: 'Unique Users',
      averageStay: 'Average Stay',
      language: 'Language',
      voiceNavigation: 'Voice Navigation',
      offlineMode: 'Offline Mode',
      trafficInfo: 'Traffic Information',
      routeMode: 'Travel Mode'
    },
    de: {
      routing: 'Navigation',
      geofencing: 'Geofencing',
      analytics: 'Analytik',
      settings: 'Einstellungen',
      destination: 'Ziel',
      startNavigation: 'Navigation starten',
      stopNavigation: 'Navigation stoppen',
      calculateRoute: 'Route berechnen',
      addZone: 'Zone hinzufügen',
      removeZone: 'Zone entfernen',
      totalVisits: 'Gesamtbesuche',
      uniqueUsers: 'Eindeutige Benutzer',
      averageStay: 'Durchschnittliche Aufenthaltsdauer',
      language: 'Sprache',
      voiceNavigation: 'Sprachnavigation',
      offlineMode: 'Offline-Modus',
      trafficInfo: 'Verkehrsinformationen',
      routeMode: 'Reisemodus'
    },
    uk: {
      routing: 'Маршрутизація',
      geofencing: 'Геозони',
      analytics: 'Аналітика',
      settings: 'Налаштування',
      destination: 'Місце призначення',
      startNavigation: 'Почати навігацію',
      stopNavigation: 'Зупинити навігацію',
      calculateRoute: 'Обчислити маршрут',
      addZone: 'Додати зону',
      removeZone: 'Видалити зону',
      totalVisits: 'Загальні відвідування',
      uniqueUsers: 'Унікальні користувачі',
      averageStay: 'Середній час перебування',
      language: 'Мова',
      voiceNavigation: 'Голосова навігація',
      offlineMode: 'Офлайн режим',
      trafficInfo: 'Інформація про рух',
      routeMode: 'Спосіб подорожі'
    }
  };

  const t = translations[language];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <MapPinIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Enhanced Geolocation System
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Zaawansowane funkcje lokalizacyjne z AI
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentLocation && (
            <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live GPS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['routing', 'geofencing', 'analytics', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {tab === 'routing' && <CompassIcon className="w-4 h-4" />}
              {tab === 'geofencing' && <ShieldCheckIcon className="w-4 h-4" />}
              {tab === 'analytics' && <ChartBarIcon className="w-4 h-4" />}
              {tab === 'settings' && <GlobeAltIcon className="w-4 h-4" />}
              <span>{t[tab]}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Routing Tab */}
        {activeTab === 'routing' && (
          <div className="space-y-6">
            {/* Route Planning */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Planowanie trasy
              </h3>
              
              {/* Route Mode Selection */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {(['driving', 'walking', 'cycling', 'transit'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRouteMode(mode)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      routeMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{getRouteModeIcon(mode)}</div>
                    <div className="text-xs capitalize">{mode}</div>
                  </button>
                ))}
              </div>

              {/* Destination Input */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={t.destination}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Enter destination"
                />
                <button
                  onClick={calculateRoute}
                  disabled={loading || !destination.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    t.calculateRoute
                  )}
                </button>
              </div>

              {/* Current Location */}
              {currentLocation && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="w-4 h-4" />
                  <span>
                    Pozycja: {currentLocation[0].toFixed(4)}, {currentLocation[1].toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            {/* Route Steps */}
            {routeSteps.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Instrukcje nawigacji
                  </h3>
                  <button
                    onClick={isNavigating ? () => setIsNavigating(false) : startNavigation}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isNavigating
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isNavigating ? t.stopNavigation : t.startNavigation}
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {routeSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg ${
                        isNavigating && index === 0
                          ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {step.instruction}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDistance(step.distance)}</span>
                          <span>{formatDuration(step.duration)}</span>
                          <span className="text-blue-600 dark:text-blue-400">{step.streetName}</span>
                        </div>
                      </div>
                      {step.turnDirection && (
                        <div className="flex-shrink-0">
                          <span className="text-lg">
                            {step.turnDirection === 'left' && '↰'}
                            {step.turnDirection === 'right' && '↱'}
                            {step.turnDirection === 'straight' && '↑'}
                            {step.turnDirection === 'u-turn' && '↶'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Geofencing Tab */}
        {activeTab === 'geofencing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Strefy geofencing
              </h3>
              <button
                onClick={addGeofenceZone}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.addZone}
              </button>
            </div>

            <div className="grid gap-4">
              {geofenceZones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(zone.category)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {zone.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {zone.type} • {zone.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={zone.notifications}
                          onChange={(e) => {
                            const updatedZones = geofenceZones.map(z =>
                              z.id === zone.id ? { ...z, notifications: e.target.checked } : z
                            );
                            setGeofenceZones(updatedZones);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                          aria-label={`Enable notifications for ${zone.name} geofence zone`}
                        />
                        <BellIcon className="w-4 h-4 text-gray-500" />
                      </label>
                      <button
                        onClick={() => removeGeofenceZone(zone.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {zone.type === 'circular' && zone.center && zone.radius && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Centrum: {zone.center[0].toFixed(4)}, {zone.center[1].toFixed(4)} • 
                      Promień: {formatDistance(zone.radius)}
                    </div>
                  )}

                  {zone.customMessage && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm text-blue-800 dark:text-blue-200">
                      {zone.customMessage}
                    </div>
                  )}

                  {zone.activeHours && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      <span>
                        Aktywne: {zone.activeHours.start} - {zone.activeHours.end}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analityka lokalizacji
            </h3>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">{t.totalVisits}</p>
                    <p className="text-2xl font-bold">{analytics.totalVisits.toLocaleString()}</p>
                  </div>
                  <HeartIcon className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">{t.uniqueUsers}</p>
                    <p className="text-2xl font-bold">{analytics.uniqueUsers.toLocaleString()}</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">{t.averageStay}</p>
                    <p className="text-2xl font-bold">{formatDuration(analytics.averageStayTime)}</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Popular Times Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                Popularne godziny
              </h4>
              <div className="flex items-end space-x-1 h-32">
                {analytics.popularTimes.map((item) => (
                  <div
                    key={item.hour}
                    className="flex-1 bg-blue-500 rounded-t"
                    data-height={`${(item.visits / Math.max(...analytics.popularTimes.map(t => t.visits))) * 100}%`}
                    title={`${item.hour}:00 - ${item.visits} wizyt`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>0:00</span>
                <span>6:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Grupy wiekowe
                </h4>
                <div className="space-y-2">
                  {Object.entries(analytics.demographics.ageGroups).map(([age, count]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{age}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            data-width={`${(count / Math.max(...Object.values(analytics.demographics.ageGroups))) * 100}%`}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Zainteresowania
                </h4>
                <div className="space-y-2">
                  {Object.entries(analytics.demographics.interests).map(([interest, count]) => (
                    <div key={interest} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {interest}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            data-width={`${(count / Math.max(...Object.values(analytics.demographics.interests))) * 100}%`}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ustawienia lokalizacji
            </h3>

            <div className="space-y-4">
              {/* Language Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.language}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  aria-label="Select interface language"
                >
                  <option value="pl">Polski</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="uk">Українська</option>
                </select>
              </div>

              {/* Toggle Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {t.voiceNavigation}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Instrukcje głosowe podczas nawigacji
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={voiceEnabled}
                        onChange={(e) => setVoiceEnabled(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Enable voice navigation instructions"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {t.offlineMode}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nawigacja bez połączenia internetowego
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offlineMode}
                        onChange={(e) => setOfflineMode(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Enable offline navigation mode"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {t.trafficInfo}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Uwzględniaj informacje o ruchu drogowym
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trafficEnabled}
                        onChange={(e) => setTrafficEnabled(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Enable traffic information in navigation"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Map Reference */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Podgląd mapy
                </h4>
                <div 
                  ref={mapRef}
                  className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                >
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <MapPinIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>Mapa zostanie załadowana tutaj</p>
                    <p className="text-sm">Integracja z OpenStreetMap & Google Maps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedGeolocationSystem;