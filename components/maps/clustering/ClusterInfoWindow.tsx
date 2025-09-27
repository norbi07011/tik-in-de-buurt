import React from 'react';
import { BusinessMarkerData } from '../GoogleMap';
import { 
  MapPinIcon, 
  StarIcon, 
  CheckBadgeIcon,
  ClockIcon,
  PhoneIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';
import './ClusterInfoWindow.css';

// 📍 Cluster Info Props
interface ClusterInfoWindowProps {
  businesses: BusinessMarkerData[];
  onBusinessSelect: (business: BusinessMarkerData) => void;
  onClose: () => void;
  maxVisible?: number;
}

// 📊 Category Statistics
interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

const ClusterInfoWindow: React.FC<ClusterInfoWindowProps> = ({
  businesses,
  onBusinessSelect,
  onClose,
  maxVisible = 5
}) => {
  // 📊 Calculate category statistics
  const categoryStats = React.useMemo(() => {
    const categoryCount: { [key: string]: number } = {};
    
    businesses.forEach(business => {
      const category = business.category || 'other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const total = businesses.length;
    const stats: CategoryStats[] = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100),
      color: getCategoryColor(category),
      icon: getCategoryIcon(category)
    }));

    return stats.sort((a, b) => b.count - a.count);
  }, [businesses]);

  // 🎨 Get category colors
  function getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      restaurant: 'bg-red-500',
      retail: 'bg-blue-500',
      healthcare: 'bg-green-500',
      beauty: 'bg-amber-500',
      service: 'bg-purple-500',
      education: 'bg-cyan-500',
      entertainment: 'bg-pink-500',
      automotive: 'bg-gray-500',
      other: 'bg-slate-500'
    };
    return colors[category] || colors.other;
  }

  // 🎯 Get category icons
  function getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      restaurant: '🍽️',
      retail: '🏪',
      healthcare: '🏥',
      beauty: '💄',
      service: '🔧',
      education: '📚',
      entertainment: '🎭',
      automotive: '🚗',
      other: '📍'
    };
    return icons[category] || icons.other;
  }

  // 📈 Calculate cluster statistics
  const stats = React.useMemo(() => {
    const totalRating = businesses.reduce((sum, b) => sum + (b.rating || 0), 0);
    const ratedCount = businesses.filter(b => b.rating && b.rating > 0).length;
    const averageRating = ratedCount > 0 ? totalRating / ratedCount : 0;
    
    return {
      total: businesses.length,
      averageRating: Math.round(averageRating * 10) / 10,
      verified: businesses.filter(b => b.isVerified === true).length,
      open: businesses.filter(b => b.isOpen).length,
      withPhone: businesses.filter(b => b.phone).length,
      withWebsite: businesses.filter(b => b.website).length
    };
  }, [businesses]);

  // 🏢 Get displayed businesses (limited)
  const displayedBusinesses = businesses.slice(0, maxVisible);
  const hasMore = businesses.length > maxVisible;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm w-80 cluster-info-window">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
            {businesses.length}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Cluster Area
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {businesses.length} businesses
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Close cluster info"
          aria-label="Close cluster info"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Statistics */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {stats.averageRating > 0 && (
            <div className="flex items-center space-x-2">
              <StarIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {stats.averageRating}★ avg
              </span>
            </div>
          )}
          
          {stats.verified > 0 && (
            <div className="flex items-center space-x-2">
              <CheckBadgeIcon className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {stats.verified} verified
              </span>
            </div>
          )}
          
          {stats.open > 0 && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {stats.open} open now
              </span>
            </div>
          )}
          
          {stats.withPhone > 0 && (
            <div className="flex items-center space-x-2">
              <PhoneIcon className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {stats.withPhone} with phone
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Category Breakdown
        </h4>
        
        <div className="space-y-2">
          {categoryStats.slice(0, 3).map((stat) => (
            <div key={stat.category} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{stat.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {stat.category}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2 cluster-progress-bar">
                  <div 
                    className={`h-2 rounded-full ${stat.color} cluster-progress-fill`}
                    data-width={stat.percentage}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
                  {stat.count}
                </span>
              </div>
            </div>
          ))}
          
          {categoryStats.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{categoryStats.length - 3} more categories
            </div>
          )}
        </div>
      </div>

      {/* Business List */}
      <div className="max-h-48 overflow-y-auto cluster-business-list">
        {displayedBusinesses.map((business) => (
          <div
            key={business.id}
            onClick={() => onBusinessSelect(business)}
            className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer transition-colors cluster-info-business"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {business.name}
                  </h5>
                  
                  {business.isVerified && (
                    <CheckBadgeIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  
                  {business.isOpen && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {business.address || `${business.category} • Business`}
                </p>
                
                {business.rating && business.rating > 0 && (
                  <div className="flex items-center mt-1">
                    <StarIcon className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                      {business.rating}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="ml-2 flex-shrink-0">
                <MapPinIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* More businesses indicator */}
      {hasMore && (
        <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            +{businesses.length - maxVisible} more businesses
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Zoom in to see individual markers
          </p>
        </div>
      )}
    </div>
  );
};

export default ClusterInfoWindow;
export type { ClusterInfoWindowProps, CategoryStats };