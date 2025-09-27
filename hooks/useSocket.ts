import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface ChatMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
  createdAt: Date;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found, cannot connect to socket');
      return;
    }

    const socketInstance = io(process.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token
      },
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Handle real-time notifications
    socketInstance.on('new_notification', (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    // Handle notification updates
    socketInstance.on('notification_update', ({ notificationId, update }: { notificationId: string; update: any }) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, ...update }
            : notif
        )
      );
      
      if (update.read === true) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    // Handle bulk notification updates
    socketInstance.on('notifications_bulk_update', (update: any) => {
      if (update.allRead) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Chat-related methods
  const joinConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('leave_conversation', conversationId);
    }
  }, [socket]);

  const startTyping = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('typing_start', conversationId);
    }
  }, [socket]);

  const stopTyping = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('typing_stop', conversationId);
    }
  }, [socket]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    notifications,
    unreadCount,
    requestNotificationPermission,
    setNotifications,
    setUnreadCount
  };
};

export default useSocket;