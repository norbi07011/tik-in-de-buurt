import React, { useState } from 'react';

export interface MapLayer {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  layerType: 'traffic' | 'transit' | 'bicycle' | 'custom';
}

interface MapLayerControlsProps {
  layers: MapLayer[];
  onLayerToggle: (layerId: string, enabled: boolean) => void;
  className?: string;
  compact?: boolean;
}

const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  layers,
  onLayerToggle,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const enabledCount = layers.filter(layer => layer.enabled).length;

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          aria-label="Toggle map layers"
        >
          <span className="text-lg">🗂️</span>
          <span className="text-sm font-medium text-gray-800">
            Layers {enabledCount > 0 && `(${enabledCount})`}
          </span>
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
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Map Layers</h4>
              <div className="space-y-2">
                {layers.map((layer) => (
                  <label
                    key={layer.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={layer.enabled}
                      onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-lg">{layer.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{layer.name}</div>
                      <div className="text-xs text-gray-500">{layer.description}</div>
                    </div>
                  </label>
                ))}
              </div>
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
      <h3 className="text-lg font-semibold text-gray-800 mb-3">🗂️ Map Layers</h3>
      <div className="space-y-3">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              layer.enabled
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{layer.icon}</span>
              <div>
                <div className="font-medium text-gray-800">{layer.name}</div>
                <div className="text-xs text-gray-500">{layer.description}</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={layer.enabled}
                onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
                className="sr-only peer"
                aria-label={`Toggle ${layer.name} layer`}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

// 🗂️ Default map layers configuration
export const DEFAULT_MAP_LAYERS: MapLayer[] = [
  {
    id: 'traffic',
    name: 'Traffic',
    icon: '🚦',
    description: 'Real-time traffic conditions',
    enabled: false,
    layerType: 'traffic'
  },
  {
    id: 'transit',
    name: 'Transit',
    icon: '🚌',
    description: 'Public transportation routes',
    enabled: false,
    layerType: 'transit'
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    icon: '🚴',
    description: 'Bike lanes and paths',
    enabled: false,
    layerType: 'bicycle'
  }
];

// 🎛️ Map layer management service
export class MapLayerService {
  private map: any | null = null;
  private layers: Map<string, any> = new Map();

  constructor(map?: any) {
    this.map = map;
  }

  setMap(map: any) {
    this.map = map;
  }

  toggleLayer(layerId: string, enabled: boolean) {
    if (!this.map || !window.google) return;

    switch (layerId) {
      case 'traffic':
        this.toggleTrafficLayer(enabled);
        break;
      case 'transit':
        this.toggleTransitLayer(enabled);
        break;
      case 'bicycle':
        this.toggleBicycleLayer(enabled);
        break;
      default:
        console.warn(`Unknown layer type: ${layerId}`);
    }
  }

  private toggleTrafficLayer(enabled: boolean) {
    if (enabled) {
      if (!this.layers.has('traffic')) {
        const trafficLayer = new window.google.maps.TrafficLayer();
        this.layers.set('traffic', trafficLayer);
      }
      this.layers.get('traffic')?.setMap(this.map);
    } else {
      this.layers.get('traffic')?.setMap(null);
    }
  }

  private toggleTransitLayer(enabled: boolean) {
    if (enabled) {
      if (!this.layers.has('transit')) {
        const transitLayer = new window.google.maps.TransitLayer();
        this.layers.set('transit', transitLayer);
      }
      this.layers.get('transit')?.setMap(this.map);
    } else {
      this.layers.get('transit')?.setMap(null);
    }
  }

  private toggleBicycleLayer(enabled: boolean) {
    if (enabled) {
      if (!this.layers.has('bicycle')) {
        const bicycleLayer = new window.google.maps.BicyclingLayer();
        this.layers.set('bicycle', bicycleLayer);
      }
      this.layers.get('bicycle')?.setMap(this.map);
    } else {
      this.layers.get('bicycle')?.setMap(null);
    }
  }

  // Cleanup all layers
  clearAllLayers() {
    this.layers.forEach(layer => {
      layer.setMap(null);
    });
    this.layers.clear();
  }

  // Get enabled layers
  getEnabledLayers(): string[] {
    const enabled: string[] = [];
    this.layers.forEach((layer, id) => {
      if (layer.getMap()) {
        enabled.push(id);
      }
    });
    return enabled;
  }
}

export default MapLayerControls;