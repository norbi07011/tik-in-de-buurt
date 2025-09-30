import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../src/store';
import { 
  BellIcon, 
  XMarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  VideoCameraIcon,
  BuildingStorefrontIcon,
  StarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';

interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'video' | 'business' | 'review' | 'payment' | 'location' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  avatar?: string;
  metadata?: {
    userId?: string;
    videoId?: string;
    businessId?: string;
    amount?: number;
    rating?: number;
  };
}

interface RealTimeNotificationsProps {
  className?: string;
  maxVisible?: number;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ 
  className = '',
  maxVisible = 5
}) => {
  const { t } = useTranslation();
  const { showToast, user } = useStore();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio('/sounds/notification.mp3');
    notificationSound.current.volume = 0.3;
  }, []);

  // Mock WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    // Simulate WebSocket connection
    const connectWebSocket = () => {
      // In real implementation, this would be: new WebSocket(`ws://localhost:8080/notifications?userId=${user.id}`)
      // For now, we'll simulate with mock data and intervals
      
      const simulateNotifications = () => {
        const mockNotifications: NotificationData[] = [
          {
            id: 'notif_' + Date.now() + '_1',
            type: 'like',
            title: 'New Like!',
            message: 'Anna Kowalska liked your video "Local Business Tour"',
            timestamp: new Date().toISOString(),
            isRead: false,
            avatar: '/images/avatar_anna.jpg',
            metadata: { userId: 'user_anna', videoId: 'video_123' }
          },
          {
            id: 'notif_' + Date.now() + '_2',
            type: 'comment',
            title: 'New Comment',
            message: 'Piotr left a comment: "Great showcase of local businesses!"',
            timestamp: new Date().toISOString(),
            isRead: false,
            avatar: '/images/avatar_piotr.jpg',
            metadata: { userId: 'user_piotr', videoId: 'video_123' }
          },
          {
            id: 'notif_' + Date.now() + '_3',
            type: 'business',
            title: 'Business Inquiry',
            message: 'Someone is interested in your photography services',
            timestamp: new Date().toISOString(),
            isRead: false,
            metadata: { businessId: 'business_photo' }
          }
        ];

        const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        addNotification(randomNotification);
      };

      // Simulate receiving notifications every 15-30 seconds
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every interval
          simulateNotifications();
        }
      }, 15000);

      return () => clearInterval(interval);
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, [user]);

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // Mock initial notifications
      const initialNotifications: NotificationData[] = [
        {
          id: 'notif_initial_1',
          type: 'follow',
          title: 'New Follower',
          message: 'Marcin Nowak started following you',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          isRead: false,
          avatar: '/images/avatar_marcin.jpg',
          metadata: { userId: 'user_marcin' }
        },
        {
          id: 'notif_initial_2',
          type: 'video',
          title: 'Video Processed',
          message: 'Your video "Property Tour Downtown" is now live!',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          isRead: true,
          metadata: { videoId: 'video_property' }
        },
        {
          id: 'notif_initial_3',
          type: 'review',
          title: 'New Review',
          message: 'You received a 5-star review for your cleaning service',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          isRead: true,
          metadata: { businessId: 'business_cleaning', rating: 5 }
        },
        {
          id: 'notif_initial_4',
          type: 'payment',
          title: 'Payment Received',
          message: 'You received 150 PLN for web development service',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isRead: true,
          metadata: { amount: 150 }
        }
      ];

      setNotifications(initialNotifications);
      updateUnreadCount(initialNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications
    updateUnreadCount([notification, ...notifications]);
    
    // Play notification sound
    if (notificationSound.current && !notification.isRead) {
      notificationSound.current.play().catch(e => console.log('Cannot play notification sound:', e));
    }

    // Show toast for important notifications
    if (notification.type === 'payment' || notification.type === 'business') {
      showToast(notification.message, 'success');
    }
  };

  const updateUnreadCount = (notificationList: NotificationData[]) => {
    const unread = notificationList.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    updateUnreadCount(updatedNotifications);

    // TODO: API call to mark as read
    // await api.markNotificationAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    // TODO: API call to mark all as read
    // await api.markAllNotificationsAsRead();
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // TODO: API call to delete notification
    // await api.deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    const iconClasses = "h-5 w-5";
    
    switch (type) {
      case 'like':
        return <HeartIcon className={`${iconClasses} text-red-500`} />;
      case 'comment':
        return <ChatBubbleLeftIcon className={`${iconClasses} text-blue-500`} />;
      case 'follow':
        return <UserPlusIcon className={`${iconClasses} text-green-500`} />;
      case 'video':
        return <VideoCameraIcon className={`${iconClasses} text-purple-500`} />;
      case 'business':
        return <BuildingStorefrontIcon className={`${iconClasses} text-orange-500`} />;
      case 'review':
        return <StarIcon className={`${iconClasses} text-yellow-500`} />;
      case 'payment':
        return <CurrencyDollarIcon className={`${iconClasses} text-green-600`} />;
      case 'location':
        return <MapPinIcon className={`${iconClasses} text-blue-600`} />;
      default:
        return <BellIcon className={`${iconClasses} text-gray-500`} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return t('notifications.justNow');
    } else if (diffInMinutes < 60) {
      return t('notifications.minutesAgo', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('notifications.hoursAgo', { count: hours });
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return t('notifications.daysAgo', { count: days });
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    markAsRead(notification.id);
    
    if (notification.actionUrl) {
      // Navigate to the relevant page
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-blue-500" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('notifications.title')}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Close notifications panel"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.slice(0, maxVisible).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar or Icon */}
                      <div className="flex-shrink-0">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatTimestamp(notification.timestamp)}
                          </p>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                aria-label="Mark notification as read"
                              >
                                <CheckIcon className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              aria-label="Delete notification"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > maxVisible && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                {t('notifications.viewAll')} ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Background overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RealTimeNotifications;