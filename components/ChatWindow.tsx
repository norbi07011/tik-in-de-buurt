import React, { useState, useEffect, useRef } from 'react';
import { 
  SendIcon as Send, 
  PaperClipIcon as Paperclip, 
  SmileIcon as Smile, 
  PhoneIcon as Phone, 
  VideoCameraIcon as VideoIcon, 
  MoreVerticalIcon as MoreVertical, 
  ArrowLeftIcon as ArrowLeft 
} from '../components/icons/Icons';
// Toast will be inline

export interface ChatMessage {
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

export interface Conversation {
  id: string;
  type: 'business_customer' | 'user_user' | 'group';
  participants: string[];
  title?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount?: number;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  isOpen, 
  onClose, 
  conversationId, 
  onConversationSelect 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      setConversations(data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setToast({ message: 'Błąd podczas pobierania konwersacji', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch conversation details
      const convResponse = await fetch(`/api/chat/conversations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!convResponse.ok) throw new Error('Failed to fetch conversation');
      const convData = await convResponse.json();
      setActiveConversation(convData.data);

      // Fetch messages
      const messagesResponse = await fetch(`/api/chat/conversations/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
      const messagesData = await messagesResponse.json();
      setMessages(messagesData.data);

      // Mark messages as read
      await markAsRead(id);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setToast({ message: 'Błąd podczas ładowania konwersacji', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'text',
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setMessages(prev => [...prev, data.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setToast({ message: 'Błąd podczas wysyłania wiadomości', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Teraz';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('pl-PL');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-full flex">
        {/* Conversations Sidebar */}
        <div className={`${activeConversation ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Wiadomości</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Zamknij chat">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && !loading ? (
              <div className="text-center p-8 text-gray-500">
                Brak konwersacji
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation);
                    loadConversation(conversation.id);
                    onConversationSelect?.(conversation.id);
                  }}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    activeConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {conversation.title ? conversation.title[0].toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.title || 'Konwersacja'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatLastMessageTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conversation.lastMessage || 'Brak wiadomości'}
                      </p>
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConversation && (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Powrót do listy konwersacji"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {activeConversation.title ? activeConversation.title[0].toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {activeConversation.title || 'Konwersacja'}
                  </h3>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Połączenie głosowe">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Połączenie wideo">
                  <VideoIcon className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Więcej opcji">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === 'current-user-id'; // TODO: Get from auth context
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
                      isOwnMessage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    } rounded-lg px-4 py-2`}>
                      {!isOwnMessage && (
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {message.senderName}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Załącz plik">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Napisz wiadomość..."
                    rows={1}
                    className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] max-h-[120px]"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Emoji">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Wyślij wiadomość"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!activeConversation && (
          <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-medium mb-2">Wybierz konwersację</h3>
              <p>Kliknij na konwersację po lewej stronie, aby rozpocząć czat</p>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg px-4 py-2 text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{toast.message}</span>
              <button 
                onClick={() => setToast(null)}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};