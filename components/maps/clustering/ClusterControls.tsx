import React from 'react';
import { 
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  MapIcon,
  ListBulletIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';

// 🎛️ Cluster Controls Props
interface ClusterControlsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  minZoom?: number;
  onMinZoomChange?: (zoom: number) => void;
  gridSize?: number;
  onGridSizeChange?: (size: number) => void;
  maxZoom?: number;
  onMaxZoomChange?: (zoom: number) => void;
  algorithm?: 'grid' | 'kmeans' | 'supercluster';
  onAlgorithmChange?: (algorithm: 'grid' | 'kmeans' | 'supercluster') => void;
  className?: string;
  compact?: boolean;
}

// 🎛️ Cluster Controls Component
const ClusterControls: React.FC<ClusterControlsProps> = ({
  isEnabled,
  onToggle,
  minZoom = 3,
  onMinZoomChange,
  gridSize = 60,
  onGridSizeChange,
  maxZoom = 15,
  onMaxZoomChange,
  algorithm = 'grid',
  onAlgorithmChange,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // 🎨 Algorithm display names
  const algorithmNames = {
    grid: 'Grid Based',
    kmeans: 'K-Means',
    supercluster: 'SuperCluster'
  };

  // 🎨 Algorithm icons
  const algorithmIcons = {
    grid: '⚏',
    kmeans: '◉',
    supercluster: '⬡'
  };

  if (compact) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggle(!isEnabled)}
              className={`p-2 rounded-md transition-colors ${
                isEnabled 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title={isEnabled ? 'Disable clustering' : 'Enable clustering'}
            >
              {isEnabled ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </button>
            
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Clustering
            </span>
          </div>
          
          {isEnabled && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Toggle settings"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isEnabled && isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Algorithm Selection */}
            {onAlgorithmChange && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Algorithm
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => onAlgorithmChange(e.target.value as any)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  title="Select clustering algorithm"
                  aria-label="Clustering algorithm"
                >
                  <option value="grid">⚏ Grid Based</option>
                  <option value="kmeans">◉ K-Means</option>
                  <option value="supercluster">⬡ SuperCluster</option>
                </select>
              </div>
            )}
            
            {/* Grid Size */}
            {onGridSizeChange && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grid Size: {gridSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  title={`Grid size: ${gridSize}px`}
                  aria-label={`Grid size: ${gridSize}px`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md ${
              isEnabled 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              <MapIcon className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Clustering Controls
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage marker clustering settings
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onToggle(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={isEnabled ? 'Disable clustering' : 'Enable clustering'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Settings */}
      {isEnabled && (
        <div className="p-4 space-y-4">
          {/* Algorithm Selection */}
          {onAlgorithmChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clustering Algorithm
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {(['grid', 'kmeans', 'supercluster'] as const).map((alg) => (
                  <button
                    key={alg}
                    onClick={() => onAlgorithmChange(alg)}
                    className={`p-3 rounded-md border text-center transition-all ${
                      algorithm === alg
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{algorithmIcons[alg]}</div>
                    <div className="text-xs font-medium">{algorithmNames[alg]}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid Size */}
          {onGridSizeChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grid Size
              </label>
              
              <div className="flex items-center space-x-3">
                <MagnifyingGlassMinusIcon className="w-4 h-4 text-gray-500" />
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="10"
                    value={gridSize}
                    onChange={(e) => onGridSizeChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    title={`Grid size: ${gridSize}px`}
                    aria-label={`Grid size: ${gridSize}px`}
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>20px</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{gridSize}px</span>
                    <span>200px</span>
                  </div>
                </div>
                
                <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          )}

          {/* Zoom Range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Min Zoom */}
            {onMinZoomChange && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Zoom
                </label>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={minZoom}
                    onChange={(e) => onMinZoomChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    title={`Minimum zoom: ${minZoom}`}
                    aria-label={`Minimum zoom level: ${minZoom}`}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                    {minZoom}
                  </span>
                </div>
              </div>
            )}

            {/* Max Zoom */}
            {onMaxZoomChange && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Zoom
                </label>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    value={maxZoom}
                    onChange={(e) => onMaxZoomChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    title={`Maximum zoom: ${maxZoom}`}
                    aria-label={`Maximum zoom level: ${maxZoom}`}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                    {maxZoom}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <ListBulletIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Clustering Tips:</p>
                <ul className="space-y-1">
                  <li>• Grid: Fast, simple clustering</li>
                  <li>• K-Means: Balanced clusters</li>
                  <li>• SuperCluster: Advanced hierarchy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterControls;
export type { ClusterControlsProps };