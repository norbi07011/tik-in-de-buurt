import React from 'react';

interface TypingIndicatorProps {
  userNames: string[];
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userNames,
  className = ''
}) => {
  if (userNames.length === 0) return null;

  const getTypingText = () => {
    if (userNames.length === 1) {
      return `${userNames[0]} pisze...`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} i ${userNames[1]} piszą...`;
    } else if (userNames.length === 3) {
      return `${userNames[0]}, ${userNames[1]} i ${userNames[2]} piszą...`;
    } else {
      return `${userNames[0]}, ${userNames[1]} i ${userNames.length - 2} innych piszą...`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 p-3 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-150"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-300"></div>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 italic">
        {getTypingText()}
      </span>
    </div>
  );
};

export default TypingIndicator;