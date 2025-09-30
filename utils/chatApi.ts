/**
 * Chat API utilities for HTTP requests
 * Handles authentication and error handling for chat-related API calls
 */

const API_BASE = '/api/chat';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ConversationData {
  id: string;
  type: 'business_customer' | 'user_user' | 'group';
  participants: string[];
  title?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount?: number;
}

interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
  read: boolean;
  createdAt: string;
}

interface CreateConversationRequest {
  type: 'business_customer' | 'user_user' | 'group';
  participants: string[];
  businessId?: string;
  title?: string;
}

interface SendMessageRequest {
  content: string;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
}

class ChatApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ChatApiError';
  }
}

/**
 * Get authentication headers with current token
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

/**
 * Handle API response and errors
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ChatApiError(
      `API Error: ${response.status} ${response.statusText} - ${errorText}`,
      response.status
    );
  }

  try {
    const data: ApiResponse<T> = await response.json();
    if (!data.success) {
      throw new ChatApiError(data.message || 'API call failed');
    }
    return data.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ChatApiError('Invalid JSON response from server');
    }
    throw error;
  }
};

/**
 * Chat API functions
 */
export const chatApi = {
  /**
   * Get user's conversations
   */
  async getConversations(): Promise<ConversationData[]> {
    const response = await fetch(`${API_BASE}/conversations`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<ConversationData[]>(response);
  },

  /**
   * Get specific conversation details
   */
  async getConversation(conversationId: string): Promise<ConversationData> {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<ConversationData>(response);
  },

  /**
   * Get messages from a conversation with pagination
   */
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<{
    messages: MessageData[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const response = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    return handleResponse<{
      messages: MessageData[];
      totalCount: number;
      hasMore: boolean;
    }>(response);
  },

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<ConversationData> {
    const response = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<ConversationData>(response);
  },

  /**
   * Send a message (fallback when WebSocket is not available)
   */
  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<MessageData> {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<MessageData>(response);
  },

  /**
   * Mark conversation messages as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    await handleResponse<void>(response);
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/messages/${messageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse<void>(response);
  },

  /**
   * Add participant to group conversation
   */
  async addParticipant(conversationId: string, participantId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/participants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ participantId })
    });
    await handleResponse<void>(response);
  },

  /**
   * Remove participant from group conversation
   */
  async removeParticipant(conversationId: string, participantId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/conversations/${conversationId}/participants/${participantId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      }
    );
    await handleResponse<void>(response);
  },

  /**
   * Get chat statistics
   */
  async getStats(): Promise<{
    totalConversations: number;
    unreadMessages: number;
    activeConversations: number;
  }> {
    const response = await fetch(`${API_BASE}/stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<{
      totalConversations: number;
      unreadMessages: number;
      activeConversations: number;
    }>(response);
  }
};

export { ChatApiError };
export type { ConversationData, MessageData, CreateConversationRequest, SendMessageRequest };