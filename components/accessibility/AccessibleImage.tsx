import React, { useState } from 'react';

interface AccessibleImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  ariaLabel?: string;
  width?: number;
  height?: number;
}

const AccessibleImage: React.FC<AccessibleImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder-image.jpg',
  loading = 'lazy',
  onClick,
  ariaLabel,
  width,
  height
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setHasError(false);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" aria-hidden="true" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        loading={loading}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        aria-label={ariaLabel || alt}
        {...(onClick ? { role: 'button' } : {})}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
      />
    </div>
  );
};

export default AccessibleImage;