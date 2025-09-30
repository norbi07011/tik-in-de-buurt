import React, { useState, useEffect } from 'react';
import './VideoAnalyticsDashboard.css';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  UsersIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface VideoMetrics {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  averageWatchTime: number;
  completionRate: number;
  retentionCurve: Array<{
    timestamp: number;
    retention: number;
  }>;
  dropOffPoints: Array<{
    timestamp: number;
    dropOffRate: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  locationData: Array<{
    country: string;
    views: number;
    percentage: number;
  }>;
  engagementRate: number;
  uniqueViewers: number;
}

interface TrendingVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  trendingScore: number;
  uploadDate: string;
  category: string;
  creator: string;
}

interface VideoAnalyticsDashboardProps {
  videoId?: string;
  businessId?: string;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | '90d') => void;
}

const VideoAnalyticsDashboard: React.FC<VideoAnalyticsDashboardProps> = ({
  videoId,
  businessId,
  timeRange = '7d',
  onTimeRangeChange
}) => {
  const [metrics, setMetrics] = useState<VideoMetrics | null>(null);
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'retention' | 'engagement' | 'demographics'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [videoId, businessId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const endpoint = videoId 
        ? `/api/video-analytics/metrics/${videoId}?timeRange=${timeRange}`
        : `/api/video-analytics/business/${businessId}/metrics?timeRange=${timeRange}`;

      const [metricsResponse, trendingResponse] = await Promise.all([
        fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/video-analytics/enhanced/trending', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!metricsResponse.ok || !trendingResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const metricsData = await metricsResponse.json();
      const trendingData = await trendingResponse.json();

      setMetrics(metricsData.metrics);
      setTrendingVideos(trendingData.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Key Metrics Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Całkowite wyświetlenia
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(metrics?.totalViews || 0)}
            </p>
          </div>
          <EyeIcon className="h-8 w-8 text-blue-500" />
        </div>
        <div className="mt-2">
          <span className="text-sm text-green-600 dark:text-green-400">
            +12.5% vs poprzedni okres
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Polubienia
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(metrics?.totalLikes || 0)}
            </p>
          </div>
          <HeartIcon className="h-8 w-8 text-red-500" />
        </div>
        <div className="mt-2">
          <span className="text-sm text-green-600 dark:text-green-400">
            +8.3% vs poprzedni okres
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Średni czas oglądania
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(metrics?.averageWatchTime || 0)}
            </p>
          </div>
          <ClockIcon className="h-8 w-8 text-yellow-500" />
        </div>
        <div className="mt-2">
          <span className="text-sm text-green-600 dark:text-green-400">
            +15.7% vs poprzedni okres
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Współczynnik ukończenia
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {((metrics?.completionRate || 0) * 100).toFixed(1)}%
            </p>
          </div>
          <ChartBarIcon className="h-8 w-8 text-green-500" />
        </div>
        <div className="mt-2">
          <span className="text-sm text-green-600 dark:text-green-400">
            +5.2% vs poprzedni okres
          </span>
        </div>
      </div>
    </div>
  );

  const renderRetentionTab = () => (
    <div className="space-y-6">
      {/* Retention Curve */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Krzywa retencji widzów
        </h3>
        <div className="h-64 flex items-end space-x-1">
          {metrics?.retentionCurve?.map((point, index) => (
            <div
              key={index}
              className={`bg-blue-500 hover:bg-blue-600 transition-colors rounded-t flex-1 retention-bar-${Math.floor(point.retention * 10)}`}
              title={`${point.timestamp}s: ${(point.retention * 100).toFixed(1)}% retencji`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>0s</span>
          <span>Środek filmu</span>
          <span>Koniec</span>
        </div>
      </div>

      {/* Top Drop-off Points */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Główne punkty odejścia
        </h3>
        <div className="space-y-3">
          {metrics?.dropOffPoints?.slice(0, 5).map((point, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatTime(point.timestamp)}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Punkt #{index + 1}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  -{(point.dropOffRate * 100).toFixed(1)}%
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  odejść
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEngagementTab = () => (
    <div className="space-y-6">
      {/* Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Współczynnik zaangażowania
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {((metrics?.engagementRate || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Udostępnienia
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(metrics?.totalShares || 0)}
              </p>
            </div>
            <ShareIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unikalni widzowie
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(metrics?.uniqueViewers || 0)}
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Trending Videos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Popularne filmy
        </h3>
        <div className="space-y-3">
          {trendingVideos.slice(0, 5).map((video, index) => (
            <div key={video.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white text-sm font-bold rounded-full">
                  {index + 1}
                </span>
              </div>
              <div className="flex-shrink-0">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-16 h-10 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-video.jpg';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {video.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {video.creator} • {video.category}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatNumber(video.views)} wyświetleń
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Trending: {video.trendingScore.toFixed(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDemographicsTab = () => (
    <div className="space-y-6">
      {/* Device Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Podział według urządzeń
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <DevicePhoneMobileIcon className="h-12 w-12 mx-auto text-blue-500 mb-2" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Telefon</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {((metrics?.deviceBreakdown?.mobile || 0) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <ComputerDesktopIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Komputer</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {((metrics?.deviceBreakdown?.desktop || 0) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <GlobeAltIcon className="h-12 w-12 mx-auto text-purple-500 mb-2" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tablet</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {((metrics?.deviceBreakdown?.tablet || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Geographic Data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Podział geograficzny
        </h3>
        <div className="space-y-3">
          {metrics?.locationData?.slice(0, 10).map((location, index) => (
            <div key={location.country} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {location.country}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`bg-blue-500 h-2 rounded-full progress-${Math.floor(location.percentage / 10)}`}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0">
                  {formatNumber(location.views)} ({location.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-300 dark:bg-gray-600 rounded-lg h-32"></div>
          ))}
        </div>
        <div className="bg-gray-300 dark:bg-gray-600 rounded-lg h-64"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analityka filmów
        </h2>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange?.(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Przegląd' },
            { id: 'retention', label: 'Retencja' },
            { id: 'engagement', label: 'Zaangażowanie' },
            { id: 'demographics', label: 'Demografia' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'retention' && renderRetentionTab()}
        {selectedTab === 'engagement' && renderEngagementTab()}
        {selectedTab === 'demographics' && renderDemographicsTab()}
      </div>
    </div>
  );
};

export default VideoAnalyticsDashboard;