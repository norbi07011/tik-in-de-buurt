import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface ChatMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
  createdAt: Date;
}

class SocketServiceClass {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  /**
   * Inicjalizuje Socket.IO server
   */
  initialize(io: Server): void {
    this.io = io;
    
    // Middleware do autoryzacji
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.id;
        
        logger.info(`User ${decoded.id} connected via WebSocket`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO server initialized');
  }

  /**
   * Obsługuje nowe połączenie WebSocket
   */
  private handleConnection(socket: Socket): void {
    const userId = socket.userId;
    
    // Dodaj socket do mapy użytkowników
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // Dołącz do pokoju użytkownika
    socket.join(`user_${userId}`);

    // Obsługa rozłączenia
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Obsługa dołączania do pokojów konwersacji
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      logger.info(`User ${userId} joined conversation ${conversationId}`);
    });

    // Obsługa opuszczania pokojów konwersacji
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      logger.info(`User ${userId} left conversation ${conversationId}`);
    });

    // Obsługa statusu "typing"
    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
        typing: true
      });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
        typing: false
      });
    });

    logger.info(`User ${userId} connected with socket ${socket.id}`);
  }

  /**
   * Obsługuje rozłączenie WebSocket
   */
  private handleDisconnection(socket: Socket): void {
    const userId = socket.userId;
    
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socket.id);
      
      // Usuń użytkownika z mapy jeśli nie ma więcej połączeń
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    logger.info(`User ${userId} disconnected from socket ${socket.id}`);
  }

  /**
   * Wysyła powiadomienie do konkretnego użytkownika
   */
  sendNotificationToUser(userId: string, notification: NotificationData): void {
    if (!this.io) return;

    this.io.to(`user_${userId}`).emit('new_notification', notification);
    logger.info(`Notification sent to user ${userId}: ${notification.type}`);
  }

  /**
   * Wysyła aktualizację powiadomienia do użytkownika
   */
  sendNotificationUpdate(userId: string, notificationId: string, update: any): void {
    if (!this.io) return;

    this.io.to(`user_${userId}`).emit('notification_update', {
      notificationId,
      update
    });
  }

  /**
   * Wysyła masową aktualizację powiadomień do użytkownika
   */
  sendBulkNotificationUpdate(userId: string, update: any): void {
    if (!this.io) return;

    this.io.to(`user_${userId}`).emit('notifications_bulk_update', update);
  }

  /**
   * Wysyła wiadomość chat do konwersacji
   */
  sendChatMessage(conversationId: string, message: ChatMessageData): void {
    if (!this.io) return;

    this.io.to(`conversation_${conversationId}`).emit('new_message', message);
    logger.info(`Chat message sent to conversation ${conversationId}`);
  }

  /**
   * Informuje o aktualizacji statusu wiadomości (przeczytane, dostarczone)
   */
  sendMessageStatusUpdate(conversationId: string, messageId: string, status: 'delivered' | 'read'): void {
    if (!this.io) return;

    this.io.to(`conversation_${conversationId}`).emit('message_status_update', {
      messageId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Sprawdza czy użytkownik jest online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Pobiera listę użytkowników online
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Wysyła informację o statusie użytkownika (online/offline)
   */
  broadcastUserStatus(userId: string, status: 'online' | 'offline'): void {
    if (!this.io) return;

    this.io.emit('user_status_update', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Wysyła powiadomienie do wszystkich użytkowników (broadcast)
   */
  broadcastToAllUsers(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, data);
    logger.info(`Broadcast sent: ${event}`);
  }

  /**
   * Wysyła powiadomienie do grupy użytkowników
   */
  sendToUserGroup(userIds: string[], event: string, data: any): void {
    if (!this.io) return;

    userIds.forEach(userId => {
      this.io!.to(`user_${userId}`).emit(event, data);
    });
    logger.info(`Group message sent to ${userIds.length} users: ${event}`);
  }
}

// Singleton instance
export const SocketService = new SocketServiceClass();

// Type augmentation dla Socket
declare module 'socket.io' {
  interface Socket {
    userId: string;
  }
}