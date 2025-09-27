import React, { useState, useEffect } from 'react';
import { MapPinIcon, FunnelIcon } from '@heroicons/react/24/outline';

// 📍 Types
interface LocationFilterProps {
  onDistanceChange: (distance: number) => void;
  onCategoryChange: (categories: string[]) => void;
  userLocation?: { lat: number; lng: number } | null;
  maxDistance?: number;
  className?: string;
}

interface FilterCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// 🏷️ Business Categories
const BUSINESS_CATEGORIES: FilterCategory[] = [
  { id: 'restaurant', name: 'Restaurants', icon: '🍕', color: 'bg-red-100 text-red-800' },
  { id: 'retail', name: 'Retail', icon: '🛍️', color: 'bg-blue-100 text-blue-800' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: 'bg-green-100 text-green-800' },
  { id: 'service', name: 'Services', icon: '🔧', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-purple-100 text-purple-800' },
  { id: 'education', name: 'Education', icon: '📚', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: 'bg-orange-100 text-orange-800' },
  { id: 'beauty', name: 'Beauty', icon: '💄', color: 'bg-pink-100 text-pink-800' }
];

// 📏 Distance Options (in kilometers)
const DISTANCE_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' }
];

const LocationFilter: React.FC<LocationFilterProps> = ({
  onDistanceChange,
  onCategoryChange,
  userLocation,
  maxDistance = 10,
  className = ""
}) => {
  const [selectedDistance, setSelectedDistance] = useState<number>(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 📍 Handle distance change
  const handleDistanceChange = (distance: number) => {
    setSelectedDistance(distance);
    onDistanceChange(distance);
  };

  // 🏷️ Handle category toggle
  const handleCategoryToggle = (categoryId: string) => {
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(updatedCategories);
    onCategoryChange(updatedCategories);
  };

  // 🔄 Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedDistance(5);
    onCategoryChange([]);
    onDistanceChange(5);
  };

  // 🎯 Auto-update when user location changes
  useEffect(() => {
    if (userLocation) {
      onDistanceChange(selectedDistance);
    }
  }, [userLocation, selectedDistance, onDistanceChange]);

  return (
    <div className={`bg-white rounded-lg shadow-lg border p-4 ${className}`}>
      {/* 📊 Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filters</h3>
          {(selectedCategories.length > 0 || selectedDistance !== 5) && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {selectedCategories.length + (selectedDistance !== 5 ? 1 : 0)} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {(selectedCategories.length > 0 || selectedDistance !== 5) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* 📍 Location Status */}
      {userLocation ? (
        <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 rounded-lg">
          <MapPinIcon className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">
            Location enabled • Showing nearby results
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-50 rounded-lg">
          <MapPinIcon className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Enable location for distance filtering
          </span>
        </div>
      )}

      {/* 📏 Distance Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Distance Radius
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DISTANCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDistanceChange(option.value)}
              disabled={!userLocation}
              className={`
                px-3 py-2 text-sm rounded-lg border transition-colors
                ${selectedDistance === option.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : userLocation
                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🏷️ Category Filters */}
      {isExpanded && (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Business Categories
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors
                  ${selectedCategories.includes(category.id)
                    ? `${category.color} border-current`
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-base">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 📈 Results Summary */}
      {userLocation && (selectedCategories.length > 0 || selectedDistance !== 5) && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p className="mb-1">
              <strong>Searching within:</strong> {selectedDistance} km
            </p>
            {selectedCategories.length > 0 && (
              <p>
                <strong>Categories:</strong> {selectedCategories.length} selected
              </p>
            )}
          </div>
        </div>
      )}

      {/* 🎯 Quick Actions */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSelectedCategories(['restaurant', 'retail']);
              onCategoryChange(['restaurant', 'retail']);
            }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            🍕 Food & Shopping
          </button>
          <button
            onClick={() => {
              setSelectedCategories(['healthcare', 'service']);
              onCategoryChange(['healthcare', 'service']);
            }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            🏥 Essential Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationFilter;
export type { LocationFilterProps, FilterCategory };