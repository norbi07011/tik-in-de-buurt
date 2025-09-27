import { Conversation, Message, IConversation, IMessage, ConversationType, MessageType } from '../models/Chat';
import { logger } from '../utils/logger';
import { SocketService } from './socketService';
import { NotificationService } from './notificationService';

export interface CreateConversationData {
  type: ConversationType;
  participants: string[];
  businessId?: string;
  title?: string;
  description?: string;
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
}

class ChatServiceClass {

  /**
   * Tworzy nową konwersację
   */
  async createConversation(data: CreateConversationData): Promise<IConversation> {
    try {
      // Sprawdź czy konwersacja już istnieje (dla typu BUSINESS_CUSTOMER)
      if (data.type === ConversationType.BUSINESS_CUSTOMER && data.businessId) {
        const existing = await Conversation.findOne({
          type: ConversationType.BUSINESS_CUSTOMER,
          businessId: data.businessId,
          participants: { $all: data.participants }
        });

        if (existing) {
          return existing;
        }
      }

      const conversation = new Conversation({
        type: data.type,
        participants: data.participants,
        businessId: data.businessId,
        title: data.title,
        description: data.description
      });

      await conversation.save();
      logger.info(`Conversation created: ${conversation._id} with ${data.participants.length} participants`);

      // Powiadom uczestników o nowej konwersacji
      data.participants.forEach(participantId => {
        SocketService.sendNotificationToUser(participantId, {
          id: (conversation._id as any).toString(),
          type: 'NEW_CONVERSATION',
          title: 'Nowa konwersacja',
          message: data.title || 'Zostałeś dodany do nowej konwersacji',
          data: {
            conversationId: conversation._id,
            conversationType: conversation.type
          },
          read: false,
          createdAt: conversation.createdAt
        });
      });

      return conversation;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Pobiera konwersacje użytkownika
   */
  async getUserConversations(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ conversations: IConversation[], total: number }> {
    try {
      const conversations = await Conversation
        .find({ participants: userId })
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      const total = await Conversation.countDocuments({ participants: userId });

      return { conversations, total };
    } catch (error) {
      logger.error('Error fetching user conversations:', error);
      throw error;
    }
  }

  /**
   * Pobiera szczegóły konwersacji
   */
  async getConversation(conversationId: string, userId: string): Promise<IConversation | null> {
    try {
      const conversation = await Conversation
        .findOne({ 
          _id: conversationId, 
          participants: userId 
        })
        .populate('lastMessage')
        .exec();

      return conversation;
    } catch (error) {
      logger.error('Error fetching conversation:', error);
      throw error;
    }
  }

  /**
   * Wysyła wiadomość
   */
  async sendMessage(data: SendMessageData): Promise<IMessage> {
    try {
      // Sprawdź czy użytkownik jest uczestnikiem konwersacji
      const conversation = await Conversation.findOne({
        _id: data.conversationId,
        participants: data.senderId
      });

      if (!conversation) {
        throw new Error('Conversation not found or user not authorized');
      }

      // Utwórz wiadomość
      const message = new Message({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        type: data.type,
        mediaUrl: data.mediaUrl,
        fileName: data.fileName,
        fileSize: data.fileSize
      });

      await message.save();

      // Aktualizuj ostatnią wiadomość w konwersacji
      conversation.lastMessage = (message._id as any).toString();
      conversation.lastActivity = new Date();
      await conversation.save();

      logger.info(`Message sent in conversation ${data.conversationId} by user ${data.senderId}`);

      // Wyślij wiadomość przez WebSocket
      SocketService.sendChatMessage(data.conversationId, {
        id: (message._id as any).toString(),
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: '', // TODO: Get sender name from User model
        content: data.content,
        type: data.type,
        mediaUrl: data.mediaUrl,
        createdAt: message.createdAt
      });

      // Wyślij powiadomienia innym uczesnikom
      const otherParticipants = conversation.participants.filter((p: string) => p !== data.senderId);
      
      for (const participantId of otherParticipants) {
        // Sprawdź czy użytkownik jest online
        if (!SocketService.isUserOnline(participantId)) {
          // Jeśli offline, wyślij powiadomienie push
          await NotificationService.createNewMessageNotification(
            participantId, 
            'Użytkownik' // TODO: Get sender name
          );
        }
      }

      return message;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Pobiera wiadomości z konwersacji
   */
  async getMessages(
    conversationId: string, 
    userId: string,
    page: number = 1, 
    limit: number = 50
  ): Promise<{ messages: IMessage[], total: number }> {
    try {
      // Sprawdź czy użytkownik ma dostęp do konwersacji
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new Error('Conversation not found or user not authorized');
      }

      const messages = await Message
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      const total = await Message.countDocuments({ conversationId });

      return { messages: messages.reverse(), total }; // Reverse to show oldest first
    } catch (error) {
      logger.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Oznacza wiadomości jako przeczytane
   */
  async markMessagesAsRead(conversationId: string, userId: string, lastMessageId?: string): Promise<number> {
    try {
      const query: any = { 
        conversationId, 
        senderId: { $ne: userId }, // Nie oznaczaj własnych wiadomości
        read: false 
      };

      if (lastMessageId) {
        query._id = { $lte: lastMessageId };
      }

      const result = await Message.updateMany(query, { 
        read: true,
        readAt: new Date()
      });

      // Informuj o zmianie statusu przez WebSocket
      if (result.modifiedCount > 0) {
        SocketService.sendMessageStatusUpdate(conversationId, lastMessageId || 'bulk', 'read');
      }

      logger.info(`Marked ${result.modifiedCount} messages as read in conversation ${conversationId}`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Usuwa wiadomość (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await Message.updateOne(
        { _id: messageId, senderId: userId },
        { deleted: true, deletedAt: new Date() }
      );

      if (result.matchedCount === 0) {
        return false;
      }

      // Informuj o usunięciu przez WebSocket
      const message = await Message.findById(messageId);
      if (message) {
        SocketService.sendChatMessage(message.conversationId, {
          id: messageId,
          conversationId: message.conversationId,
          senderId: userId,
          senderName: '',
          content: '[Wiadomość została usunięta]',
          type: MessageType.TEXT,
          createdAt: message.createdAt
        });
      }

      return true;
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Dodaje uczestnika do konwersacji grupowej
   */
  async addParticipant(conversationId: string, userId: string, newParticipantId: string): Promise<boolean> {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        type: ConversationType.GROUP
      });

      if (!conversation) {
        throw new Error('Conversation not found or user not authorized');
      }

      if (conversation.participants.includes(newParticipantId)) {
        return false; // Already a participant
      }

      conversation.participants.push(newParticipantId);
      await conversation.save();

      // Powiadom nowego uczestnika
      SocketService.sendNotificationToUser(newParticipantId, {
        id: conversationId,
        type: 'ADDED_TO_GROUP',
        title: 'Dodano do grupy',
        message: `Zostałeś dodany do grupy: ${conversation.title || 'Bez nazwy'}`,
        data: { conversationId },
        read: false,
        createdAt: new Date()
      });

      return true;
    } catch (error) {
      logger.error('Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Usuwa uczestnika z konwersacji
   */
  async removeParticipant(conversationId: string, userId: string, participantToRemove: string): Promise<boolean> {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new Error('Conversation not found or user not authorized');
      }

      // Usuń uczestnika
      conversation.participants = conversation.participants.filter((p: string) => p !== participantToRemove);
      await conversation.save();

      // Informuj o usunięciu
      SocketService.sendNotificationToUser(participantToRemove, {
        id: conversationId,
        type: 'REMOVED_FROM_GROUP',
        title: 'Usunięto z grupy',
        message: `Zostałeś usunięty z grupy: ${conversation.title || 'Bez nazwy'}`,
        data: { conversationId },
        read: false,
        createdAt: new Date()
      });

      return true;
    } catch (error) {
      logger.error('Error removing participant:', error);
      throw error;
    }
  }

  /**
   * Pobiera statystyki konwersacji dla użytkownika
   */
  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    unreadConversations: number;
    totalMessages: number;
    unreadMessages: number;
  }> {
    try {
      const totalConversations = await Conversation.countDocuments({ participants: userId });
      
      // Znajdź konwersacje z nieprzeczytanymi wiadomościami
      const conversationsWithUnread = await Conversation.aggregate([
        { $match: { participants: userId } },
        {
          $lookup: {
            from: 'messages',
            let: { conversationId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$conversationId', '$$conversationId'] },
                      { $ne: ['$senderId', userId] },
                      { $eq: ['$read', false] }
                    ]
                  }
                }
              }
            ],
            as: 'unreadMessages'
          }
        },
        { $match: { 'unreadMessages.0': { $exists: true } } }
      ]);

      const totalMessages = await Message.countDocuments({ 
        conversationId: { $in: await this.getUserConversationIds(userId) }
      });

      const unreadMessages = await Message.countDocuments({
        conversationId: { $in: await this.getUserConversationIds(userId) },
        senderId: { $ne: userId },
        read: false
      });

      return {
        totalConversations,
        unreadConversations: conversationsWithUnread.length,
        totalMessages,
        unreadMessages
      };
    } catch (error) {
      logger.error('Error fetching conversation stats:', error);
      throw error;
    }
  }

  /**
   * Helper: Pobiera ID konwersacji użytkownika
   */
  private async getUserConversationIds(userId: string): Promise<string[]> {
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    return conversations.map((c: any) => c._id.toString());
  }
}

export const ChatService = new ChatServiceClass();