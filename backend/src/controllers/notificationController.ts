import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';
// import { validationResult } from 'express-validator';

export class NotificationController {
  
  /**
   * Pobiera powiadomienia użytkownika
   * GET /api/notifications
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unread === 'true';

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await NotificationService.getForUser(userId, page, limit, unreadOnly);

      res.json({
        success: true,
        data: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        },
        unreadCount: result.unreadCount
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch notifications'
      });
    }
  }

  /**
   * Oznacza powiadomienie jako przeczytane
   * PATCH /api/notifications/:id/read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const notificationId = req.params.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const success = await NotificationService.markAsRead(notificationId, userId);

      if (!success) {
        res.status(404).json({ 
          error: 'Not found',
          message: 'Notification not found or already read'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to mark notification as read'
      });
    }
  }

  /**
   * Oznacza wszystkie powiadomienia jako przeczytane
   * PATCH /api/notifications/read-all
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${count} notifications marked as read`
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  /**
   * Usuwa powiadomienie
   * DELETE /api/notifications/:id
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const notificationId = req.params.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const success = await NotificationService.delete(notificationId, userId);

      if (!success) {
        res.status(404).json({ 
          error: 'Not found',
          message: 'Notification not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to delete notification'
      });
    }
  }

  /**
   * Tworzy nowe powiadomienie (admin endpoint)
   * POST /api/notifications
   */
  static async createNotification(req: Request, res: Response): Promise<void> {
    try {
      // Validation would be handled by middleware
      if (!req.body.recipientId || !req.body.type || !req.body.title || !req.body.message) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Missing required fields: recipientId, type, title, message'
        });
        return;
      }

      const userId = req.user?.id;
      const { recipientId, type, title, message, data, sendEmail } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // TODO: Add admin role check here
      // if (req.user.role !== 'admin') {
      //   res.status(403).json({ error: 'Forbidden' });
      //   return;
      // }

      const notification = await NotificationService.create({
        recipientId,
        type,
        title,
        message,
        data,
        sendEmail
      });

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to create notification'
      });
    }
  }

  /**
   * Pobiera statystyki powiadomień
   * GET /api/notifications/stats
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { notifications, unreadCount } = await NotificationService.getForUser(userId, 1, 1);
      
      res.json({
        success: true,
        data: {
          unreadCount
        }
      });
    } catch (error) {
      logger.error('Error fetching notification stats:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch notification statistics'
      });
    }
  }
}