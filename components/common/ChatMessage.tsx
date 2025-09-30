import React from 'react';
import { CheckIcon as Check, CheckDoubleIcon as CheckDouble } from '../icons/Icons';

interface ChatMessageProps {
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    type: 'text' | 'image' | 'file';
    mediaUrl?: string;
    read: boolean;
    createdAt: string;
  };
  currentUserId: string;
  onDelete?: (messageId: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUserId,
  onDelete,
  onImageClick
}) => {
  const isOwnMessage = message.senderId === currentUserId;
  const messageTime = new Date(message.createdAt).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isOwnMessage && onDelete) {
      e.preventDefault();
      const confirmed = window.confirm('Czy na pewno chcesz usunąć tę wiadomość?');
      if (confirmed) {
        onDelete(message.id);
      }
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Załączony obraz"
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onImageClick?.(message.mediaUrl!)}
                loading="lazy"
              />
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            {message.mediaUrl && (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>Pobierz załącznik</span>
              </a>
            )}
          </div>
        );
      
      default:
        return (
          <p className="text-sm text-gray-500 italic">
            Nieobsługiwany typ wiadomości
          </p>
        );
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      onContextMenu={handleContextMenu}
    >
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 shadow-sm ${
          isOwnMessage
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
        }`}
      >
        {/* Sender name (only for received messages in group chats) */}
        {!isOwnMessage && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {message.senderName}
          </div>
        )}
        
        {/* Message content */}
        <div className="mb-1">
          {renderMessageContent()}
        </div>
        
        {/* Time and read status */}
        <div className={`flex items-center justify-end space-x-1 text-xs ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span>{messageTime}</span>
          {isOwnMessage && (
            <div className="flex items-center">
              {message.read ? (
                <CheckDouble className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;