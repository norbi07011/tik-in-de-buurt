import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChartBarIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  RocketLaunchIcon,
  SparklesIcon,
  CpuChipIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import VideoAnalyticsDetailed from '../components/analytics/VideoAnalyticsDetailed';
import RealTimeNotifications from '../components/notifications/RealTimeNotifications';
import EnhancedBusinessDashboard from '../components/dashboard/EnhancedBusinessDashboard';
import EnhancedChatSystem from '../components/chat/EnhancedChatSystem';

const AdvancedFeaturesDemo: React.FC = () => {
  const { t } = useTranslation();
  const [activeDemo, setActiveDemo] = useState<string>('analytics');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const demoSections = [
    {
      id: 'analytics',
      title: 'Video Analytics Dashboard',
      description: 'Advanced analytics and metrics for video content creators',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'notifications',
      title: 'Real-Time Notifications',
      description: 'Live notification system with WebSocket integration',
      icon: <BellIcon className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'business',
      title: 'Business Dashboard',
      description: 'Comprehensive business management and analytics',
      icon: <BuildingStorefrontIcon className="h-6 w-6" />,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'chat',
      title: 'Enhanced Chat System',
      description: 'Advanced messaging with file sharing and reactions',
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const features = [
    {
      title: 'AI-Powered Analytics',
      description: 'Advanced video performance tracking with ML insights',
      icon: <CpuChipIcon className="h-8 w-8 text-blue-500" />
    },
    {
      title: 'Real-Time Engagement',
      description: 'Live notifications and instant messaging system',
      icon: <SparklesIcon className="h-8 w-8 text-purple-500" />
    },
    {
      title: 'Business Intelligence',
      description: 'Comprehensive dashboard with revenue tracking',
      icon: <ChartBarIcon className="h-8 w-8 text-green-500" />
    },
    {
      title: 'Enhanced UX',
      description: 'Modern interface with accessibility features',
      icon: <EyeIcon className="h-8 w-8 text-orange-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                <RocketLaunchIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 Advanced Features Demo
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Experience the next generation of our platform with cutting-edge analytics, 
              real-time notifications, enhanced business tools, and advanced messaging.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Features Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            New Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {demoSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveDemo(section.id)}
                className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                  activeDemo === section.id
                    ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-xl'
                    : 'shadow-lg hover:shadow-xl'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${section.color} opacity-10`}></div>
                <div className="relative flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color} text-white`}>
                    {section.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {section.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="mb-8">
          {activeDemo === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  📊 Video Analytics Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced analytics with detailed performance metrics, audience insights, and engagement tracking.
                </p>
              </div>
              <VideoAnalyticsDetailed videoId="demo_video_123" />
            </div>
          )}

          {activeDemo === 'notifications' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🔔 Real-Time Notifications
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Live notification system with sound alerts, categorization, and instant updates.
                </p>
              </div>
              
              {/* Notification Demo Container */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Notification Center Demo
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click the bell icon to see notifications →
                    </span>
                    <RealTimeNotifications />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Features:</h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Real-time WebSocket connection
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Sound notifications
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        Categorized by type
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                        Mark as read/unread
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                        Delete notifications
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Notification Types:</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-700 dark:text-red-300">
                        ❤️ Likes
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-700 dark:text-blue-300">
                        💬 Comments
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700 dark:text-green-300">
                        👥 Followers
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-purple-700 dark:text-purple-300">
                        🎥 Videos
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-orange-700 dark:text-orange-300">
                        🏢 Business
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-yellow-700 dark:text-yellow-300">
                        ⭐ Reviews
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'business' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🏢 Enhanced Business Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive business management with analytics, customer insights, and performance tracking.
                </p>
              </div>
              <EnhancedBusinessDashboard businessId="demo_business_123" />
            </div>
          )}

          {activeDemo === 'chat' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  💬 Enhanced Chat System
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced messaging with file sharing, reactions, replies, and real-time features.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Chat System Demo
                  </h3>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    <span>Open Chat Demo</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Core Features:</h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Real-time messaging
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        File & image sharing
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        Message reactions
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                        Reply to messages
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Advanced Features:</h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Typing indicators
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Read receipts
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        Online status
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                        Contact search
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">User Types:</h4>
                    <div className="space-y-2 text-xs">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-700 dark:text-blue-300">
                        👤 Regular Users
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700 dark:text-green-300">
                        🏢 Businesses
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-purple-700 dark:text-purple-300">
                        💼 Freelancers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            🔧 Technical Implementation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Frontend</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• React 18 + TypeScript</li>
                <li>• Chart.js for analytics</li>
                <li>• Tailwind CSS styling</li>
                <li>• WebSocket integration</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Backend</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Node.js + Express</li>
                <li>• MongoDB Atlas</li>
                <li>• Socket.io for real-time</li>
                <li>• JWT authentication</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Features</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Real-time updates</li>
                <li>• File upload system</li>
                <li>• Advanced analytics</li>
                <li>• Mobile responsive</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Performance</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Lazy loading</li>
                <li>• Code splitting</li>
                <li>• Optimized images</li>
                <li>• Caching strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat System Modal */}
      <EnhancedChatSystem 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialContactId="contact_1"
      />
    </div>
  );
};

export default AdvancedFeaturesDemo;