import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Wszystkie routes wymagają autoryzacji
router.use(authenticateToken);

// GET /api/chat/stats - statystyki chatu użytkownika
router.get('/stats', ChatController.getStats);

// GET /api/chat/conversations - pobiera konwersacje użytkownika
router.get('/conversations', ChatController.getConversations);

// POST /api/chat/conversations - tworzy nową konwersację
router.post('/conversations', ChatController.createConversation);

// GET /api/chat/conversations/:id - pobiera szczegóły konwersacji
router.get('/conversations/:id', ChatController.getConversation);

// GET /api/chat/conversations/:id/messages - pobiera wiadomości z konwersacji
router.get('/conversations/:id/messages', ChatController.getMessages);

// POST /api/chat/conversations/:id/messages - wysyła wiadomość
router.post('/conversations/:id/messages', ChatController.sendMessage);

// PATCH /api/chat/conversations/:id/read - oznacza wiadomości jako przeczytane
router.patch('/conversations/:id/read', ChatController.markAsRead);

// POST /api/chat/conversations/:id/participants - dodaje uczestnika do konwersacji grupowej
router.post('/conversations/:id/participants', ChatController.addParticipant);

// DELETE /api/chat/conversations/:id/participants/:participantId - usuwa uczestnika z konwersacji
router.delete('/conversations/:id/participants/:participantId', ChatController.removeParticipant);

// DELETE /api/chat/messages/:id - usuwa wiadomość
router.delete('/messages/:id', ChatController.deleteMessage);

export default router;