import React, { useState } from 'react';
import StreetViewModal from './StreetViewModal';

interface StreetViewButtonProps {
  position: { lat: number; lng: number };
  businessName?: string;
  address?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showLabel?: boolean;
}

const StreetViewButton: React.FC<StreetViewButtonProps> = ({
  position,
  businessName,
  address,
  className = '',
  size = 'md',
  variant = 'outline',
  showLabel = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center space-x-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title="Zobacz w Street View"
        aria-label={`Zobacz ${businessName || 'lokalizację'} w Street View`}
      >
        {/* Street View Icon */}
        <svg 
          className={iconSizes[size]} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        </svg>
        
        {showLabel && (
          <span>Street View</span>
        )}
      </button>

      {/* Street View Modal */}
      <StreetViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        position={position}
        businessName={businessName}
        address={address}
      />
    </>
  );
};

export default StreetViewButton;