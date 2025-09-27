import { Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { ConversationType, MessageType } from '../models/Chat';
import { logger } from '../utils/logger';

export class ChatController {
  
  /**
   * Tworzy nową konwersację
   * POST /api/chat/conversations
   */
  static async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { type, participants, businessId, title, description } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!type || !participants || !Array.isArray(participants)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Type and participants array are required'
        });
        return;
      }

      // Dodaj aktualnego użytkownika do uczestników jeśli nie ma go tam
      if (!participants.includes(userId)) {
        participants.push(userId);
      }

      const conversation = await ChatService.createConversation({
        type,
        participants,
        businessId,
        title,
        description
      });

      res.status(201).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      logger.error('Error creating conversation:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to create conversation'
      });
    }
  }

  /**
   * Pobiera konwersacje użytkownika
   * GET /api/chat/conversations
   */
  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await ChatService.getUserConversations(userId, page, limit);

      res.json({
        success: true,
        data: result.conversations,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch conversations'
      });
    }
  }

  /**
   * Pobiera szczegóły konwersacji
   * GET /api/chat/conversations/:id
   */
  static async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const conversationId = req.params.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const conversation = await ChatService.getConversation(conversationId, userId);

      if (!conversation) {
        res.status(404).json({ 
          error: 'Not found',
          message: 'Conversation not found'
        });
        return;
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      logger.error('Error fetching conversation:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch conversation'
      });
    }
  }

  /**
   * Wysyła wiadomość
   * POST /api/chat/conversations/:id/messages
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const conversationId = req.params.id;
      const { content, type, mediaUrl, fileName, fileSize } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Message content is required'
        });
        return;
      }

      const message = await ChatService.sendMessage({
        conversationId,
        senderId: userId,
        content: content.trim(),
        type: type || MessageType.TEXT,
        mediaUrl,
        fileName,
        fileSize
      });

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      if (error instanceof Error && error.message.includes('not authorized')) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'You are not a participant of this conversation'
        });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to send message'
        });
      }
    }
  }

  /**
   * Pobiera wiadomości z konwersacji
   * GET /api/chat/conversations/:id/messages
   */
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const conversationId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await ChatService.getMessages(conversationId, userId, page, limit);

      res.json({
        success: true,
        data: result.messages,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching messages:', error);
      if (error instanceof Error && error.message.includes('not authorized')) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'You are not a participant of this conversation'
        });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to fetch messages'
        });
      }
    }
  }

  /**
   * Oznacza wiadomości jako przeczytane
   * PATCH /api/chat/conversations/:id/read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const conversationId = req.params.id;
      const { lastMessageId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await ChatService.markMessagesAsRead(conversationId, userId, lastMessageId);

      res.json({
        success: true,
        message: `${count} messages marked as read`
      });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to mark messages as read'
      });
    }
  }

  /**
   * Usuwa wiadomość
   * DELETE /api/chat/messages/:id
   */
  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const messageId = req.params.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const success = await ChatService.deleteMessage(messageId, userId);

      if (!success) {
        res.status(404).json({ 
          error: 'Not found',
          message: 'Message not found or you are not the sender'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Message deleted'
      });
    } catch (error) {
      logger.error('Error deleting message:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to delete message'
      });
    }
  }

  /**
   * Dodaje uczestnika do konwersacji grupowej
   * POST /api/chat/conversations/:id/participants
   */
  static async addParticipant(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const conversationId = req.params.id;
      const { participantId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!participantId) {
        res.status(400).json({
          error: 'Validation error',
          message: 'participantId is required'
        });
        return;
      }

      const success = await ChatService.addParticipant(conversationId, userId, participantId);

      if (!success) {
        res.status(400).json({ 
          error: 'Bad request',
          message: 'Failed to add participant (may already be in conversation)'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Participant added successfully'
      });
    } catch (error) {
      logger.error('Error adding participant:', error);
      if (error instanceof Error && error.message.includes('not authorized')) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'You are not authorized to add participants to this conversation'
        });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to add participant'
        });
      }
    }
  }

  /**
   * Usuwa uczestnika z konwersacji
   * DELETE /api/chat/conversations/:id/participants/:participantId
   */
  static async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const conversationId = req.params.id;
      const participantId = req.params.participantId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const success = await ChatService.removeParticipant(conversationId, userId, participantId);

      if (!success) {
        res.status(400).json({ 
          error: 'Bad request',
          message: 'Failed to remove participant'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Participant removed successfully'
      });
    } catch (error) {
      logger.error('Error removing participant:', error);
      if (error instanceof Error && error.message.includes('not authorized')) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'You are not authorized to remove participants from this conversation'
        });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to remove participant'
        });
      }
    }
  }

  /**
   * Pobiera statystyki chatu użytkownika
   * GET /api/chat/stats
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const stats = await ChatService.getConversationStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching chat stats:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch chat statistics'
      });
    }
  }
}