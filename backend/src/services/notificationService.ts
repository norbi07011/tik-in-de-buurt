import Notification, { INotification, NotificationType } from '../models/Notification';
import { logger } from '../utils/logger';
// import { SocketService } from './socketService'; // Temporarily disabled to fix build
import { emailService } from './emailService';

export interface CreateNotificationData {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  sendEmail?: boolean;
}

class NotificationService {
  
  /**
   * Tworzy nowe powiadomienie
   */
  static async create(notificationData: CreateNotificationData): Promise<INotification> {
    try {
      const notification = new Notification({
        recipientId: notificationData.recipientId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || null
      });

      await notification.save();
      logger.info(`Notification created for user ${notificationData.recipientId}: ${notificationData.type}`);

      // Send real-time notification via WebSocket
      // SocketService.sendNotificationToUser(notificationData.recipientId, {
      //   id: (notification._id as any).toString(),
      //   type: notification.type,
      //   title: notification.title,
      //   message: notification.message,
      //   data: notification.data,
      //   read: notification.read,
      //   createdAt: notification.createdAt
      // });

      // Send email notification if requested
      if (notificationData.sendEmail) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Pobiera powiadomienia dla użytkownika
   */
  static async getForUser(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: INotification[], total: number, unreadCount: number }> {
    try {
      const query: any = { recipientId: userId };
      if (unreadOnly) {
        query.read = false;
      }

      const notifications = await Notification
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ 
        recipientId: userId, 
        read: false 
      });

      return { notifications, total, unreadCount };
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Oznacza powiadomienie jako przeczytane
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.updateOne(
        { _id: notificationId, recipientId: userId },
        { read: true }
      );

      if (result.matchedCount === 0) {
        return false;
      }

      // Inform client about read status change
      // SocketService.sendNotificationUpdate(userId, notificationId, { read: true });
      
      return true;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Oznacza wszystkie powiadomienia jako przeczytane
   */
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await Notification.updateMany(
        { recipientId: userId, read: false },
        { read: true }
      );

      // Inform client about bulk read status change
      // Powiadomienie przez WebSocket o zmianie stanu wszystkich
      // SocketService.sendBulkNotificationUpdate(userId, { allRead: true });

      logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Usuwa powiadomienie
   */
  static async delete(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipientId: userId
      });

      if (result.deletedCount === 0) {
        return false;
      }

      // Inform client about deletion
      // SocketService.sendNotificationUpdate(userId, notificationId, { deleted: true });

      return true;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Usuwa stare powiadomienia (starsze niż 30 dni)
   */
  static async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true
      });

      logger.info(`Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Wysyła powiadomienie email jako fallback
   */
  private static async sendEmailNotification(notification: INotification): Promise<void> {
    try {
      // This would need user's email address from User model
      // For now, we'll just log it
      logger.info(`Email notification would be sent for: ${notification.title}`);
      
      // TODO: Implement actual email sending
      // const user = await User.findById(notification.recipientId);
      // if (user?.email) {
      //   await emailService.sendNotificationEmail({
      //     to: user.email,
      //     subject: notification.title,
      //     html: notification.message
      //   });
      // }
    } catch (error) {
      logger.error('Error sending email notification:', error);
      // Don't throw - email is fallback, not critical
    }
  }

  /**
   * Helper methods for common notification types
   */
  
  static async createNewReviewNotification(businessOwnerId: string, reviewerName: string, rating: number): Promise<void> {
    await this.create({
      recipientId: businessOwnerId,
      type: NotificationType.NEW_REVIEW,
      title: 'Nowa recenzja!',
      message: `${reviewerName} dodał recenzję z oceną ${rating}/5 gwiazdek`,
      data: { reviewerName, rating },
      sendEmail: true
    });
  }

  static async createNewMessageNotification(recipientId: string, senderName: string): Promise<void> {
    await this.create({
      recipientId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'Nowa wiadomość',
      message: `${senderName} wysłał Ci wiadomość`,
      data: { senderName }
    });
  }

  static async createSubscriptionExpiringNotification(businessOwnerId: string, daysLeft: number): Promise<void> {
    await this.create({
      recipientId: businessOwnerId,
      type: NotificationType.SUBSCRIPTION_EXPIRING,
      title: 'Subskrypcja wygasa',
      message: `Twoja subskrypcja wygasa za ${daysLeft} dni. Odnów ją, aby zachować wszystkie funkcje.`,
      data: { daysLeft },
      sendEmail: true
    });
  }
}

export { NotificationService };