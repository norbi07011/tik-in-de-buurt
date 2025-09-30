import { useState, useEffect, useCallback } from 'react';
import { chatApi, ConversationData, MessageData, ChatApiError } from '../utils/chatApi';
import { useSocket } from './useSocket';

interface ChatState {
  conversations: ConversationData[];
  activeConversation: ConversationData | null;
  messages: MessageData[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  typingUsers: string[];
}

interface UseChatOptions {
  autoConnect?: boolean;
  markAsReadOnView?: boolean;
}

export const useChat = (options: UseChatOptions = {}) => {
  const { autoConnect = true, markAsReadOnView = true } = options;
  
  const [state, setState] = useState<ChatState>({
    conversations: [],
    activeConversation: null,
    messages: [],
    loading: false,
    sending: false,
    error: null,
    typingUsers: []
  });

  const { 
    socket, 
    isConnected, 
    connect, 
    sendChatMessage, 
    onChatMessage, 
    joinConversation, 
    leaveConversation,
    startTyping,
    stopTyping
  } = useSocket();

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !isConnected) {
      connect();
    }
  }, [autoConnect, isConnected, connect]);

  // Set up WebSocket message handler
  useEffect(() => {
    if (socket && onChatMessage) {
      const cleanup = onChatMessage((message) => {
        // Convert ChatMessageData to MessageData
        const messageData: MessageData = {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          type: message.type,
          mediaUrl: message.mediaUrl,
          read: false,
          createdAt: message.createdAt.toString()
        };
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, messageData]
        }));
        
        // Update conversation last message
        setState(prev => ({
          ...prev,
          conversations: prev.conversations.map(conv => 
            conv.id === message.conversationId
              ? {
                  ...conv,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt.toString(),
                  unreadCount: (conv.unreadCount || 0) + 1
                }
              : conv
          )
        }));
      });

      return cleanup || (() => {});
    }
  }, [socket, onChatMessage]);

  // Set up typing indicators
  useEffect(() => {
    if (socket) {
      const handleTypingStart = (data: { userId: string; userName: string; conversationId: string }) => {
        if (data.conversationId === state.activeConversation?.id) {
          setState(prev => ({
            ...prev,
            typingUsers: [...prev.typingUsers.filter(u => u !== data.userName), data.userName]
          }));
        }
      };

      const handleTypingStop = (data: { userId: string; userName: string; conversationId: string }) => {
        setState(prev => ({
          ...prev,
          typingUsers: prev.typingUsers.filter(u => u !== data.userName)
        }));
      };

      socket.on('typing_start', handleTypingStart);
      socket.on('typing_stop', handleTypingStop);

      return () => {
        socket.off('typing_start', handleTypingStart);
        socket.off('typing_stop', handleTypingStop);
      };
    }
  }, [socket, state.activeConversation?.id]);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const fetchConversations = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const conversations = await chatApi.getConversations();
      setState(prev => ({ ...prev, conversations, loading: false }));
    } catch (error) {
      const message = error instanceof ChatApiError ? error.message : 'Błąd podczas pobierania konwersacji';
      setState(prev => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Leave previous conversation
      if (state.activeConversation && leaveConversation) {
        leaveConversation(state.activeConversation.id);
      }

      // Fetch conversation details
      const conversation = await chatApi.getConversation(conversationId);
      
      // Fetch messages
      const { messages } = await chatApi.getMessages(conversationId);
      
      setState(prev => ({
        ...prev,
        activeConversation: conversation,
        messages,
        loading: false,
        typingUsers: []
      }));

      // Join WebSocket room
      if (joinConversation) {
        joinConversation(conversationId);
      }

      // Mark as read if enabled
      if (markAsReadOnView) {
        await chatApi.markAsRead(conversationId);
        setState(prev => ({
          ...prev,
          conversations: prev.conversations.map(conv =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        }));
      }
    } catch (error) {
      const message = error instanceof ChatApiError ? error.message : 'Błąd podczas ładowania konwersacji';
      setState(prev => ({ ...prev, error: message, loading: false }));
    }
  }, [state.activeConversation, leaveConversation, joinConversation, markAsReadOnView]);

  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!content.trim() || !state.activeConversation || state.sending) return;

    try {
      setState(prev => ({ ...prev, sending: true, error: null }));

      if (sendChatMessage && isConnected) {
        // Send via WebSocket
        sendChatMessage({
          conversationId: state.activeConversation.id,
          content: content.trim(),
          type
        });
      } else {
        // Fallback to API
        const message = await chatApi.sendMessage(state.activeConversation.id, {
          content: content.trim(),
          type
        });
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, message]
        }));
      }

      setState(prev => ({ ...prev, sending: false }));
      return true;
    } catch (error) {
      const message = error instanceof ChatApiError ? error.message : 'Błąd podczas wysyłania wiadomości';
      setState(prev => ({ ...prev, error: message, sending: false }));
      return false;
    }
  }, [state.activeConversation, state.sending, sendChatMessage, isConnected]);

  const createConversation = useCallback(async (data: {
    type: 'business_customer' | 'user_user' | 'group';
    participants: string[];
    businessId?: string;
    title?: string;
  }) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const conversation = await chatApi.createConversation(data);
      
      setState(prev => ({
        ...prev,
        conversations: [conversation, ...prev.conversations],
        loading: false
      }));
      
      return conversation;
    } catch (error) {
      const message = error instanceof ChatApiError ? error.message : 'Błąd podczas tworzenia konwersacji';
      setState(prev => ({ ...prev, error: message, loading: false }));
      return null;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId)
      }));
    } catch (error) {
      const message = error instanceof ChatApiError ? error.message : 'Błąd podczas usuwania wiadomości';
      setState(prev => ({ ...prev, error: message }));
    }
  }, []);

  const startTypingIndicator = useCallback(() => {
    if (state.activeConversation && startTyping) {
      startTyping(state.activeConversation.id);
    }
  }, [state.activeConversation, startTyping]);

  const stopTypingIndicator = useCallback(() => {
    if (state.activeConversation && stopTyping) {
      stopTyping(state.activeConversation.id);
    }
  }, [state.activeConversation, stopTyping]);

  return {
    // State
    conversations: state.conversations,
    activeConversation: state.activeConversation,
    messages: state.messages,
    loading: state.loading,
    sending: state.sending,
    error: state.error,
    typingUsers: state.typingUsers,
    isConnected,

    // Actions
    fetchConversations,
    selectConversation,
    sendMessage,
    createConversation,
    deleteMessage,
    startTypingIndicator,
    stopTypingIndicator,
    clearError,

    // Utils
    setError
  };
};

export default useChat;