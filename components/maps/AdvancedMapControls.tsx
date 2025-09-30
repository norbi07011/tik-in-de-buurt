import React, { useState, useEffect } from 'react';
import MapThemeSelector, { MAP_THEMES, MapTheme } from './MapThemeSelector';
import MapLayerControls, { DEFAULT_MAP_LAYERS, MapLayer, MapLayerService } from './MapLayerControls';

interface AdvancedMapControlsProps {
  map: any | null;
  onThemeChange?: (themeId: string) => void;
  className?: string;
  compact?: boolean;
  defaultTheme?: string;
}

const AdvancedMapControls: React.FC<AdvancedMapControlsProps> = ({
  map,
  onThemeChange,
  className = '',
  compact = false,
  defaultTheme = 'standard'
}) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [layers, setLayers] = useState<MapLayer[]>(DEFAULT_MAP_LAYERS);
  const [layerService] = useState(() => new MapLayerService(map));
  const [isExpanded, setIsExpanded] = useState(false);

  // Update layer service when map changes
  useEffect(() => {
    if (map) {
      layerService.setMap(map);
    }
  }, [map, layerService]);

  // Apply theme to map
  useEffect(() => {
    if (map) {
      const theme = MAP_THEMES.find(t => t.id === currentTheme);
      if (theme) {
        map.setOptions({
          styles: theme.styles
        });
      }
    }
  }, [map, currentTheme]);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    onThemeChange?.(themeId);
  };

  const handleLayerToggle = (layerId: string, enabled: boolean) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId ? { ...layer, enabled } : layer
      )
    );
    layerService.toggleLayer(layerId, enabled);
  };

  if (compact) {
    const enabledLayersCount = layers.filter(l => l.enabled).length;
    const currentThemeObj = MAP_THEMES.find(t => t.id === currentTheme) || MAP_THEMES[0];

    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          aria-label="Advanced map controls"
        >
          <span className="text-lg">⚙️</span>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-800">Map Options</div>
            <div className="text-xs text-gray-500">
              {currentThemeObj.name} • {enabledLayersCount} layers
            </div>
          </div>
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
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🎨 <span>Map Themes</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {MAP_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`flex flex-col items-center p-2 rounded-lg border transition-all text-xs ${
                        theme.id === currentTheme
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                      title={theme.description}
                    >
                      <span className="text-lg mb-1">{theme.icon}</span>
                      <span className="font-medium text-center">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🗂️ <span>Map Layers</span>
                </h4>
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <label
                      key={layer.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={layer.enabled}
                        onChange={(e) => handleLayerToggle(layer.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        aria-label={`Toggle ${layer.name} layer`}
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
    <div className={`space-y-6 ${className}`}>
      <MapThemeSelector
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
      <MapLayerControls
        layers={layers}
        onLayerToggle={handleLayerToggle}
      />
    </div>
  );
};

export default AdvancedMapControls;