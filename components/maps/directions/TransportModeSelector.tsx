import React from 'react';

// 🌐 Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

type GoogleTravelMode = any;

export interface TransportMode {
  key: GoogleTravelMode;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface TransportModeSelectorProps {
  selectedMode: GoogleTravelMode;
  onModeChange: (mode: GoogleTravelMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
  compact = false
}) => {
  // Transport mode options
  const transportModes: TransportMode[] = [
    {
      key: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING',
      label: 'Driving',
      icon: '🚗',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Car navigation with traffic'
    },
    {
      key: window.google?.maps?.TravelMode?.WALKING || 'WALKING',
      label: 'Walking',
      icon: '🚶',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Pedestrian routes'
    },
    {
      key: window.google?.maps?.TravelMode?.BICYCLING || 'BICYCLING',
      label: 'Cycling',
      icon: '🚴',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Bike-friendly routes'
    },
    {
      key: window.google?.maps?.TravelMode?.TRANSIT || 'TRANSIT',
      label: 'Transit',
      icon: '🚌',
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Public transportation'
    }
  ];

  if (compact) {
    // Compact horizontal layout
    return (
      <div className="flex items-center space-x-2 bg-white rounded-lg shadow-md p-2">
        {transportModes.map((mode) => {
          const isSelected = selectedMode === mode.key;
          return (
            <button
              key={mode.key}
              onClick={() => onModeChange(mode.key)}
              disabled={disabled}
              className={`
                flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200
                ${isSelected 
                  ? `${mode.color} text-white shadow-lg scale-105` 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`${mode.label} - ${mode.description}`}
              aria-label={`Select ${mode.label} transport mode`}
            >
              <span className="text-lg">{mode.icon}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Full layout with labels
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Transport Mode</h4>
      <div className="grid grid-cols-2 gap-2">
        {transportModes.map((mode) => {
          const isSelected = selectedMode === mode.key;
          return (
            <button
              key={mode.key}
              onClick={() => onModeChange(mode.key)}
              disabled={disabled}
              className={`
                flex items-center space-x-3 p-3 rounded-md transition-all duration-200 text-left
                ${isSelected 
                  ? `${mode.color} text-white shadow-lg` 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
              `}
              title={mode.description}
              aria-label={`Select ${mode.label} transport mode`}
            >
              <span className="text-xl">{mode.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{mode.label}</div>
                {!isSelected && (
                  <div className="text-xs opacity-75 truncate">{mode.description}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TransportModeSelector;