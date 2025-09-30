import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChartBarIcon, 
  EyeIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  ShareIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VideoAnalyticsData {
  videoId: string;
  title: string;
  totalViews: number;
  uniqueViews: number;
  averageWatchTime: number;
  totalWatchTime: number;
  completionRate: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  engagement: number;
  retentionCurve: number[];
  viewsByDevice: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  viewsByCountry: {
    [country: string]: number;
  };
  viewsByAge: {
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55+': number;
  };
  dailyViews: {
    date: string;
    views: number;
    watchTime: number;
  }[];
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    external: number;
  };
  peakViewingHours: number[];
}

interface VideoAnalyticsDetailedProps {
  videoId: string;
  className?: string;
}

const VideoAnalyticsDetailed: React.FC<VideoAnalyticsDetailedProps> = ({ 
  videoId, 
  className = '' 
}) => {
  const { t } = useTranslation();
  const [analyticsData, setAnalyticsData] = useState<VideoAnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: VideoAnalyticsData = {
        videoId,
        title: 'Amazing Local Business Showcase',
        totalViews: 12547,
        uniqueViews: 8934,
        averageWatchTime: 185, // seconds
        totalWatchTime: 2318495, // seconds
        completionRate: 68.5,
        likes: 1247,
        dislikes: 23,
        comments: 189,
        shares: 567,
        engagement: 15.8,
        retentionCurve: [100, 95, 88, 82, 76, 71, 68, 65, 62, 58, 54, 50, 47, 44, 41, 38, 35, 32, 29, 26],
        viewsByDevice: {
          mobile: 8345,
          desktop: 3156,
          tablet: 1046
        },
        viewsByCountry: {
          'Poland': 7845,
          'Germany': 2134,
          'Netherlands': 1567,
          'UK': 891,
          'Other': 110
        },
        viewsByAge: {
          '18-24': 3567,
          '25-34': 4234,
          '35-44': 2890,
          '45-54': 1456,
          '55+': 400
        },
        dailyViews: [
          { date: '2025-09-22', views: 1234, watchTime: 234567 },
          { date: '2025-09-23', views: 1567, watchTime: 298453 },
          { date: '2025-09-24', views: 2134, watchTime: 405789 },
          { date: '2025-09-25', views: 1876, watchTime: 356712 },
          { date: '2025-09-26', views: 2345, watchTime: 445623 },
          { date: '2025-09-27', views: 1789, watchTime: 340189 },
          { date: '2025-09-28', views: 1602, watchTime: 304567 }
        ],
        trafficSources: {
          direct: 45,
          search: 28,
          social: 19,
          external: 8
        },
        peakViewingHours: [2, 5, 8, 12, 15, 18, 20, 22]
      };
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };
    
    loadAnalytics();
  }, [videoId, selectedTimeRange]);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          {t('analytics.noData')}
        </div>
      </div>
    );
  }

  // Chart configurations
  const viewsChartData = {
    labels: analyticsData.dailyViews.map(d => d.date),
    datasets: [
      {
        label: 'Views',
        data: analyticsData.dailyViews.map(d => d.views),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Watch Time (min)',
        data: analyticsData.dailyViews.map(d => Math.round(d.watchTime / 60)),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const deviceData = {
    labels: ['Mobile', 'Desktop', 'Tablet'],
    datasets: [{
      data: [
        analyticsData.viewsByDevice.mobile,
        analyticsData.viewsByDevice.desktop,
        analyticsData.viewsByDevice.tablet
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(249, 115, 22, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const retentionData = {
    labels: analyticsData.retentionCurve.map((_, i) => `${i * 5}%`),
    datasets: [{
      label: 'Audience Retention',
      data: analyticsData.retentionCurve,
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const engagementData = {
    labels: ['Reach', 'Engagement', 'Retention', 'Conversion', 'Virality'],
    datasets: [{
      label: 'Performance Score',
      data: [85, 78, 69, 72, 66],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(59, 130, 246)'
    }]
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2" />
              Video Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {analyticsData.title}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Select analytics time range"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.totalViews)}</p>
              </div>
              <EyeIcon className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Avg Watch Time</p>
                <p className="text-2xl font-bold">{formatTime(analyticsData.averageWatchTime)}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Engagement Rate</p>
                <p className="text-2xl font-bold">{analyticsData.engagement}%</p>
              </div>
              <HeartIcon className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Completion Rate</p>
                <p className="text-2xl font-bold">{analyticsData.completionRate}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Views and Watch Time Chart */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Views & Watch Time Trends
            </h3>
            <Line 
              data={viewsChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left'
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                      drawOnChartArea: false
                    }
                  }
                }
              }}
            />
          </div>

          {/* Device Distribution */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Views by Device
            </h3>
            <Doughnut 
              data={deviceData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>

          {/* Audience Retention */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Audience Retention
            </h3>
            <Line 
              data={retentionData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>

          {/* Performance Radar */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Overview
            </h3>
            <Radar 
              data={engagementData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Engagement Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Engagement Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Likes</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(analyticsData.likes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Comments</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(analyticsData.comments)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShareIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Shares</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(analyticsData.shares)}
                </span>
              </div>
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Countries
            </h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.viewsByCountry)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([country, views]) => (
                <div key={country} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">{country}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(views)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Traffic Sources
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Direct</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analyticsData.trafficSources.direct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ComputerDesktopIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Search</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analyticsData.trafficSources.search}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Social</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analyticsData.trafficSources.social}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalyticsDetailed;