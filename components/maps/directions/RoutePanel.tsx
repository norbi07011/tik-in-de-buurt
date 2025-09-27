import React from 'react';
import { 
  XMarkIcon, 
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { RouteResult } from './DirectionsService';

export interface RoutePanelProps {
  route: RouteResult | null;
  isVisible: boolean;
  onClose: () => void;
  onStepClick?: (stepIndex: number) => void;
}

const RoutePanel: React.FC<RoutePanelProps> = ({
  route,
  isVisible,
  onClose,
  onStepClick
}) => {
  if (!isVisible || !route) {
    return null;
  }

  // Get direction icon based on maneuver
  const getDirectionIcon = (maneuver: string) => {
    switch (maneuver.toLowerCase()) {
      case 'turn-left':
      case 'ramp-left':
      case 'fork-left':
      case 'keep-left':
        return <ArrowLeftIcon className="w-4 h-4" />;
      case 'turn-right':
      case 'ramp-right':
      case 'fork-right':
      case 'keep-right':
        return <ArrowRightIcon className="w-4 h-4" />;
      case 'straight':
      case 'continue':
        return <ArrowUpIcon className="w-4 h-4" />;
      default:
        return <ArrowUpIcon className="w-4 h-4" />;
    }
  };

  // Get maneuver color based on type
  const getManeuverColor = (maneuver: string) => {
    switch (maneuver.toLowerCase()) {
      case 'turn-left':
      case 'ramp-left':
      case 'fork-left':
        return 'text-blue-600 bg-blue-50';
      case 'turn-right':
      case 'ramp-right':
      case 'fork-right':
        return 'text-green-600 bg-green-50';
      case 'straight':
      case 'continue':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Turn-by-Turn Directions</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-800 rounded-full transition-colors"
            title="Close directions"
            aria-label="Close directions"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Route Summary */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <MapPinIcon className="w-4 h-4" />
            <span>{route.totalDistance}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>{route.totalDuration}</span>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {route.steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => onStepClick?.(index)}
          >
            {/* Direction Icon */}
            <div className={`p-2 rounded-full ${getManeuverColor(step.maneuver)} flex-shrink-0`}>
              {getDirectionIcon(step.maneuver)}
            </div>
            
            {/* Step Details */}
            <div className="flex-1 min-w-0">
              {/* Step Number */}
              <div className="text-xs text-gray-500 mb-1">Step {index + 1}</div>
              
              {/* Instruction */}
              <div className="text-sm font-medium text-gray-900 mb-2 leading-relaxed">
                {step.instruction}
              </div>
              
              {/* Distance and Duration */}
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                {step.distance && (
                  <span className="flex items-center space-x-1">
                    <MapPinIcon className="w-3 h-3" />
                    <span>{step.distance}</span>
                  </span>
                )}
                {step.duration && (
                  <span className="flex items-center space-x-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{step.duration}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 p-4">
        <div className="text-xs text-gray-500 text-center">
          Tap any step to view it on the map
        </div>
      </div>
    </div>
  );
};

export default RoutePanel;