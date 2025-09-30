import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BuildingStorefrontIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  StarIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  PhotoIcon,
  VideoCameraIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

interface BusinessMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  newCustomers: number;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  inquiries: number;
  bookings: number;
  completedJobs: number;
}

interface BusinessAnalytics {
  revenueByMonth: { month: string; revenue: number }[];
  customersByAge: { age: string; count: number }[];
  servicesPerformance: { service: string; bookings: number; revenue: number }[];
  trafficSources: { source: string; percentage: number }[];
  popularDays: { day: string; bookings: number }[];
  topKeywords: { keyword: string; searches: number }[];
}

interface BusinessPost {
  id: string;
  type: 'photo' | 'video' | 'offer' | 'announcement';
  title: string;
  content: string;
  mediaUrl?: string;
  likes: number;
  views: number;
  shares: number;
  comments: number;
  createdAt: string;
  isPromoted: boolean;
}

interface EnhancedBusinessDashboardProps {
  businessId: string;
  className?: string;
}

const EnhancedBusinessDashboard: React.FC<EnhancedBusinessDashboardProps> = ({ 
  businessId, 
  className = '' 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // Mock data loading
  useEffect(() => {
    const loadBusinessData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetrics: BusinessMetrics = {
        totalRevenue: 45680,
        monthlyRevenue: 8900,
        totalCustomers: 234,
        newCustomers: 28,
        averageRating: 4.8,
        totalReviews: 187,
        profileViews: 1456,
        inquiries: 45,
        bookings: 23,
        completedJobs: 201
      };

      const mockAnalytics: BusinessAnalytics = {
        revenueByMonth: [
          { month: 'Jan', revenue: 6800 },
          { month: 'Feb', revenue: 7200 },
          { month: 'Mar', revenue: 8100 },
          { month: 'Apr', revenue: 7500 },
          { month: 'May', revenue: 8900 },
          { month: 'Jun', revenue: 9200 }
        ],
        customersByAge: [
          { age: '18-25', count: 45 },
          { age: '26-35', count: 89 },
          { age: '36-45', count: 67 },
          { age: '46-55', count: 23 },
          { age: '55+', count: 10 }
        ],
        servicesPerformance: [
          { service: 'Web Development', bookings: 15, revenue: 12500 },
          { service: 'Mobile App', bookings: 8, revenue: 18900 },
          { service: 'Consulting', bookings: 12, revenue: 8400 },
          { service: 'Maintenance', bookings: 23, revenue: 5880 }
        ],
        trafficSources: [
          { source: 'Direct', percentage: 45 },
          { source: 'Search', percentage: 32 },
          { source: 'Social Media', percentage: 18 },
          { source: 'Referrals', percentage: 5 }
        ],
        popularDays: [
          { day: 'Monday', bookings: 12 },
          { day: 'Tuesday', bookings: 18 },
          { day: 'Wednesday', bookings: 23 },
          { day: 'Thursday', bookings: 19 },
          { day: 'Friday', bookings: 15 },
          { day: 'Saturday', bookings: 8 },
          { day: 'Sunday', bookings: 4 }
        ],
        topKeywords: [
          { keyword: 'web development', searches: 89 },
          { keyword: 'mobile app', searches: 67 },
          { keyword: 'react developer', searches: 45 },
          { keyword: 'wordpress', searches: 34 },
          { keyword: 'ecommerce', searches: 28 }
        ]
      };

      const mockPosts: BusinessPost[] = [
        {
          id: 'post_1',
          type: 'video',
          title: 'New Project Showcase',
          content: 'Check out our latest e-commerce platform built with React and Node.js',
          mediaUrl: '/videos/project-showcase.mp4',
          likes: 45,
          views: 234,
          shares: 12,
          comments: 8,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isPromoted: true
        },
        {
          id: 'post_2',
          type: 'offer',
          title: 'Special Discount - 20% Off',
          content: 'Get 20% off on all web development services this month!',
          likes: 67,
          views: 456,
          shares: 23,
          comments: 15,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          isPromoted: false
        },
        {
          id: 'post_3',
          type: 'photo',
          title: 'Team Working',
          content: 'Our team hard at work on a new mobile application',
          mediaUrl: '/images/team-working.jpg',
          likes: 34,
          views: 189,
          shares: 7,
          comments: 5,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          isPromoted: false
        }
      ];

      setMetrics(mockMetrics);
      setAnalytics(mockAnalytics);
      setPosts(mockPosts);
      setIsLoading(false);
    };

    loadBusinessData();
  }, [businessId, selectedTimeRange]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
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

  if (!metrics || !analytics) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          {t('dashboard.noData')}
        </div>
      </div>
    );
  }

  // Chart configurations
  const revenueChartData = {
    labels: analytics.revenueByMonth.map(d => d.month),
    datasets: [{
      label: 'Revenue',
      data: analytics.revenueByMonth.map(d => d.revenue),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const customerAgeData = {
    labels: analytics.customersByAge.map(d => d.age),
    datasets: [{
      data: analytics.customersByAge.map(d => d.count),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const servicesData = {
    labels: analytics.servicesPerformance.map(s => s.service),
    datasets: [
      {
        label: 'Bookings',
        data: analytics.servicesPerformance.map(s => s.bookings),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Revenue (PLN)',
        data: analytics.servicesPerformance.map(s => s.revenue / 100),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        yAxisID: 'y1'
      }
    ]
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <BuildingStorefrontIcon className="h-6 w-6 mr-2" />
              Business Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your business performance and analytics
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Select time range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Post
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
            { id: 'posts', label: 'Posts', icon: PhotoIcon },
            { id: 'customers', label: 'Customers', icon: UserGroupIcon },
            { id: 'settings', label: 'Settings', icon: PencilIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Monthly Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</p>
                  </div>
                  <CurrencyDollarIcon className="h-8 w-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Customers</p>
                    <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Average Rating</p>
                    <p className="text-2xl font-bold">{metrics.averageRating}</p>
                  </div>
                  <StarIcon className="h-8 w-8 text-yellow-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Profile Views</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.profileViews)}</p>
                  </div>
                  <EyeIcon className="h-8 w-8 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">New Booking</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-medium">+{formatCurrency(1500)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">New Review</p>
                        <p className="text-xs text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                    <span className="text-yellow-600 font-medium">5 stars</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">New Inquiry</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <span className="text-blue-600 font-medium">Pending</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Revenue Trend
                </h3>
                <Line 
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Demographics */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Customer Demographics
                </h3>
                <Doughnut 
                  data={customerAgeData}
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

              {/* Services Performance */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Services Performance
                </h3>
                <Bar 
                  data={servicesData}
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
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Traffic Sources
                </h3>
                <div className="space-y-3">
                  {analytics.trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{source.source}</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            data-percentage={`${source.percentage}%`}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{source.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Search Keywords
                </h3>
                <div className="space-y-3">
                  {analytics.topKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{keyword.keyword}</span>
                      <span className="text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {keyword.searches}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Posts
              </h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Post
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                  {post.mediaUrl && (
                    <div className="h-48 bg-gray-200 dark:bg-gray-700">
                      {post.type === 'video' ? (
                        <video 
                          src={post.mediaUrl} 
                          className="w-full h-full object-cover"
                          poster="/images/video-placeholder.jpg"
                        />
                      ) : (
                        <img 
                          src={post.mediaUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{post.title}</h4>
                      {post.isPromoted && (
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">
                          Promoted
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {post.views}
                        </span>
                        <span className="flex items-center">
                          <HeartIcon className="h-4 w-4 mr-1" />
                          {post.likes}
                        </span>
                        <span className="flex items-center">
                          <ShareIcon className="h-4 w-4 mr-1" />
                          {post.shares}
                        </span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" aria-label="Edit post">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'customers' && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            Customer management coming soon...
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            Business settings coming soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedBusinessDashboard;