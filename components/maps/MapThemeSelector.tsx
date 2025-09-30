import React, { useState } from 'react';

// Map theme component for Google Maps styling

export interface MapTheme {
  id: string;
  name: string;
  styles: any[]; // Using any[] to avoid Google Maps type issues
  icon: string;
  description: string;
}

// 🎨 Predefined map themes
export const MAP_THEMES: MapTheme[] = [
  {
    id: 'standard',
    name: 'Standard',
    styles: [],
    icon: '🗺️',
    description: 'Default Google Maps style'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    icon: '🌙',
    description: 'Dark theme for night viewing',
    styles: [
      {
        elementType: 'geometry',
        stylers: [
          {
            color: '#242f3e'
          }
        ]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#242f3e'
          }
        ]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#746855'
          }
        ]
      },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#d59563'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#d59563'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [
          {
            color: '#263c3f'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#6b9a76'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
          {
            color: '#38414e'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#212a37'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#9ca5b3'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [
          {
            color: '#746855'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#1f2835'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#f3d19c'
          }
        ]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [
          {
            color: '#2f3948'
          }
        ]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#d59563'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [
          {
            color: '#17263c'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#515c6d'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#17263c'
          }
        ]
      }
    ]
  },
  {
    id: 'retro',
    name: 'Retro',
    icon: '🎭',
    description: 'Vintage map styling',
    styles: [
      {
        elementType: 'geometry',
        stylers: [
          {
            color: '#ebe3cd'
          }
        ]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#523735'
          }
        ]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#f5f1e6'
          }
        ]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#c9b2a6'
          }
        ]
      },
      {
        featureType: 'administrative.land_parcel',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#dcd2be'
          }
        ]
      },
      {
        featureType: 'administrative.land_parcel',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#ae9e90'
          }
        ]
      },
      {
        featureType: 'landscape.natural',
        elementType: 'geometry',
        stylers: [
          {
            color: '#dfd2ae'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
          {
            color: '#dfd2ae'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#93817c'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry.fill',
        stylers: [
          {
            color: '#a5b076'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#447530'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
          {
            color: '#f5f1e6'
          }
        ]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [
          {
            color: '#fdfcf8'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [
          {
            color: '#f8c967'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#e9bc62'
          }
        ]
      },
      {
        featureType: 'road.highway.controlled_access',
        elementType: 'geometry',
        stylers: [
          {
            color: '#e98d58'
          }
        ]
      },
      {
        featureType: 'road.highway.controlled_access',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#db8555'
          }
        ]
      },
      {
        featureType: 'road.local',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#806b63'
          }
        ]
      },
      {
        featureType: 'transit.line',
        elementType: 'geometry',
        stylers: [
          {
            color: '#dfd2ae'
          }
        ]
      },
      {
        featureType: 'transit.line',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#8f7d77'
          }
        ]
      },
      {
        featureType: 'transit.line',
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#ebe3cd'
          }
        ]
      },
      {
        featureType: 'transit.station',
        elementType: 'geometry',
        stylers: [
          {
            color: '#dfd2ae'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'geometry.fill',
        stylers: [
          {
            color: '#b9d3c2'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#92998d'
          }
        ]
      }
    ]
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: '⚪',
    description: 'Clean monochrome styling',
    styles: [
      {
        elementType: 'geometry',
        stylers: [
          {
            color: '#f5f5f5'
          }
        ]
      },
      {
        elementType: 'labels.icon',
        stylers: [
          {
            visibility: 'off'
          }
        ]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#616161'
          }
        ]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#f5f5f5'
          }
        ]
      },
      {
        featureType: 'administrative.land_parcel',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#bdbdbd'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
          {
            color: '#eeeeee'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#757575'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [
          {
            color: '#e5e5e5'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#9e9e9e'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
          {
            color: '#ffffff'
          }
        ]
      },
      {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#757575'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [
          {
            color: '#dadada'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#616161'
          }
        ]
      },
      {
        featureType: 'road.local',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#9e9e9e'
          }
        ]
      },
      {
        featureType: 'transit.line',
        elementType: 'geometry',
        stylers: [
          {
            color: '#e5e5e5'
          }
        ]
      },
      {
        featureType: 'transit.station',
        elementType: 'geometry',
        stylers: [
          {
            color: '#eeeeee'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [
          {
            color: '#c9c9c9'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#9e9e9e'
          }
        ]
      }
    ]
  },
  {
    id: 'aubergine',
    name: 'Aubergine',
    icon: '🍆',
    description: 'Deep purple luxury theme',
    styles: [
      {
        elementType: 'geometry',
        stylers: [
          {
            color: '#1d2c4d'
          }
        ]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#8ec3b9'
          }
        ]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#1a3646'
          }
        ]
      },
      {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#4b6878'
          }
        ]
      },
      {
        featureType: 'administrative.land_parcel',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#64779f'
          }
        ]
      },
      {
        featureType: 'administrative.province',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#4b6878'
          }
        ]
      },
      {
        featureType: 'landscape.man_made',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#334e87'
          }
        ]
      },
      {
        featureType: 'landscape.natural',
        elementType: 'geometry',
        stylers: [
          {
            color: '#023e58'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
          {
            color: '#283d6a'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#6f9ba4'
          }
        ]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#1d2c4d'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry.fill',
        stylers: [
          {
            color: '#023e58'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#3C7680'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
          {
            color: '#304a7d'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#98a5be'
          }
        ]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#1d2c4d'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [
          {
            color: '#2c6675'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
          {
            color: '#255763'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#b0d5ce'
          }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#023e58'
          }
        ]
      },
      {
        featureType: 'transit',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#98a5be'
          }
        ]
      },
      {
        featureType: 'transit',
        elementType: 'labels.text.stroke',
        stylers: [
          {
            color: '#1d2c4d'
          }
        ]
      },
      {
        featureType: 'transit.line',
        elementType: 'geometry.fill',
        stylers: [
          {
            color: '#283d6a'
          }
        ]
      },
      {
        featureType: 'transit.station',
        elementType: 'geometry',
        stylers: [
          {
            color: '#3a4762'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [
          {
            color: '#0e1626'
          }
        ]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          {
            color: '#4e6d70'
          }
        ]
      }
    ]
  }
];

interface MapThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  className?: string;
  compact?: boolean;
}

const MapThemeSelector: React.FC<MapThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedTheme = MAP_THEMES.find(theme => theme.id === currentTheme) || MAP_THEMES[0];

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          aria-label="Select map theme"
        >
          <span className="text-lg">{selectedTheme.icon}</span>
          <span className="text-sm font-medium text-gray-800">{selectedTheme.name}</span>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-2">
              {MAP_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id);
                    setIsExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    theme.id === currentTheme 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{theme.icon}</span>
                  <div>
                    <div className="font-medium">{theme.name}</div>
                    <div className="text-xs text-gray-500">{theme.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isExpanded && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">🎨 Map Themes</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MAP_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:shadow-md ${
              theme.id === currentTheme
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
            title={theme.description}
          >
            <span className="text-2xl mb-2">{theme.icon}</span>
            <span className="text-sm font-medium text-center">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapThemeSelector;