import React, { useState } from 'react';
import { 
  MapPinIcon, 
  PlusIcon, 
  XMarkIcon,
  ArrowsUpDownIcon,
  BookmarkIcon,
  ShareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { BusinessMarkerData } from '../GoogleMap';
import TransportModeSelector from './TransportModeSelector';

// 🌐 Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

type GoogleTravelMode = any;

export interface RouteControlsProps {
  origin: { lat: number; lng: number } | null;
  destination: BusinessMarkerData | null;
  waypoints: BusinessMarkerData[];
  travelMode: GoogleTravelMode;
  isCalculating: boolean;
  onTravelModeChange: (mode: GoogleTravelMode) => void;
  onAddWaypoint: (business: BusinessMarkerData) => void;
  onRemoveWaypoint: (index: number) => void;
  onReorderWaypoints: (waypoints: BusinessMarkerData[]) => void;
  onClearRoute: () => void;
  onSaveRoute?: () => void;
  onShareRoute?: () => void;
}

const RouteControls: React.FC<RouteControlsProps> = ({
  origin,
  destination,
  waypoints,
  travelMode,
  isCalculating,
  onTravelModeChange,
  onAddWaypoint,
  onRemoveWaypoint,
  onReorderWaypoints,
  onClearRoute,
  onSaveRoute,
  onShareRoute
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Handle waypoint drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newWaypoints = [...waypoints];
    const [draggedWaypoint] = newWaypoints.splice(draggedIndex, 1);
    newWaypoints.splice(dropIndex, 0, draggedWaypoint);
    
    onReorderWaypoints(newWaypoints);
    setDraggedIndex(null);
  };

  const hasRoute = destination || waypoints.length > 0;

  return (
    <div className="fixed bottom-6 left-6 bg-white rounded-lg shadow-2xl max-w-sm z-40 transition-all duration-300">
      {/* Header */}
      <div 
        className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Route Planning</span>
          </div>
          <div className="flex items-center space-x-2">
            {isCalculating && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            )}
            <ArrowsUpDownIcon 
              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>
        
        {/* Quick Status */}
        {!isExpanded && hasRoute && (
          <div className="mt-2 text-sm text-gray-600">
            {destination && `To: ${destination.name}`}
            {waypoints.length > 0 && ` • ${waypoints.length} stop${waypoints.length > 1 ? 's' : ''}`}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Transport Mode Selector */}
          <TransportModeSelector
            selectedMode={travelMode}
            onModeChange={onTravelModeChange}
            disabled={isCalculating}
            compact={true}
          />

          {/* Route Points */}
          <div className="space-y-2">
            {/* Origin */}
            {origin && (
              <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-md">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-700">Your Location</span>
              </div>
            )}

            {/* Waypoints */}
            {waypoints.map((waypoint, index) => (
              <div
                key={`${waypoint.id}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-md cursor-move hover:bg-yellow-100 transition-colors"
              >
                <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {index + 1}. {waypoint.name}
                </span>
                <button
                  onClick={() => onRemoveWaypoint(index)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                  title="Remove waypoint"
                  aria-label={`Remove waypoint ${waypoint.name}`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Destination */}
            {destination && (
              <div className="flex items-center space-x-3 p-2 bg-red-50 rounded-md">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-700 flex-1 truncate">{destination.name}</span>
              </div>
            )}

            {/* No Route Message */}
            {!hasRoute && (
              <div className="text-center py-4 text-gray-500">
                <MapPinIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Click on a business to start route planning</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {hasRoute && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              {/* Add Waypoint Button */}
              <button
                onClick={() => {/* Handle add waypoint */}}
                className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm"
                title="Add waypoint"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Stop</span>
              </button>

              {/* Save Route */}
              {onSaveRoute && (
                <button
                  onClick={onSaveRoute}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  title="Save route"
                  aria-label="Save route"
                >
                  <BookmarkIcon className="w-4 h-4" />
                </button>
              )}

              {/* Share Route */}
              {onShareRoute && (
                <button
                  onClick={onShareRoute}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  title="Share route"
                  aria-label="Share route"
                >
                  <ShareIcon className="w-4 h-4" />
                </button>
              )}

              {/* Clear Route */}
              <button
                onClick={onClearRoute}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors ml-auto"
                title="Clear route"
                aria-label="Clear route"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteControls;