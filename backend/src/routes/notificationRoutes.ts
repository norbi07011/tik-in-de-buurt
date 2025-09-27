import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Wszystkie routes wymagają autoryzacji
router.use(authenticateToken);

// GET /api/notifications - pobiera powiadomienia użytkownika
router.get('/', NotificationController.getNotifications);

// GET /api/notifications/stats - pobiera statystyki powiadomień
router.get('/stats', NotificationController.getStats);

// PATCH /api/notifications/read-all - oznacza wszystkie jako przeczytane
router.patch('/read-all', NotificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - oznacza konkretne powiadomienie jako przeczytane
router.patch('/:id/read', NotificationController.markAsRead);

// DELETE /api/notifications/:id - usuwa powiadomienie
router.delete('/:id', NotificationController.deleteNotification);

// POST /api/notifications - tworzy nowe powiadomienie (admin only)
router.post('/', NotificationController.createNotification);

export default router;