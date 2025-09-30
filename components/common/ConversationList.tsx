import React from 'react';
import { UserIcon } from '../icons/Icons';

interface Conversation {
  id: string;
  type: 'business_customer' | 'user_user' | 'group';
  participants: string[];
  title?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  loading = false
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 7 * 24) {
      return date.toLocaleDateString('pl-PL', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) {
      return conversation.title;
    }
    
    switch (conversation.type) {
      case 'business_customer':
        return 'Obsługa klienta';
      case 'user_user':
        return 'Rozmowa prywatna';
      case 'group':
        return `Grupa (${conversation.participants.length})`;
      default:
        return 'Konwersacja';
    }
  };

  const truncateMessage = (message: string, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <UserIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Brak konwersacji
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Rozpocznij pierwszą konwersację, aby zobaczyć ją tutaj
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onConversationSelect(conversation.id)}
          className={`flex items-center space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 transition-colors ${
            activeConversationId === conversation.id
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              : ''
          }`}
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            {/* Online indicator (you can implement this logic based on real-time data) */}
            {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div> */}
          </div>

          {/* Conversation info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getConversationTitle(conversation)}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                {conversation.lastMessageAt && formatTime(conversation.lastMessageAt)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {conversation.lastMessage 
                  ? truncateMessage(conversation.lastMessage)
                  : 'Brak wiadomości'
                }
              </p>
              
              {/* Unread count */}
              {conversation.unreadCount && conversation.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full ml-2 flex-shrink-0">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;