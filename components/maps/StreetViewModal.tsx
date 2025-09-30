import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeftIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '../icons/Icons';

// Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface StreetViewModalProps {
  isOpen: boolean;
  onClose: () => void;  
  position: { lat: number; lng: number };
  businessName?: string;
  address?: string;
}

const StreetViewModal: React.FC<StreetViewModalProps> = ({
  isOpen,
  onClose,
  position,
  businessName,
  address
}) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [panorama, setPanorama] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streetViewData, setStreetViewData] = useState<{
    location?: string;
    copyright?: string;
    imageDate?: string;
  }>({});

  // Initialize Street View
  useEffect(() => {
    if (!isOpen || !streetViewRef.current || !window.google) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create Street View panorama
      const streetViewPanorama = new (window as any).google.maps.StreetViewPanorama(
        streetViewRef.current,
        {
          position: new (window as any).google.maps.LatLng(position.lat, position.lng),
          pov: {
            heading: 0,
            pitch: 0
          },
          zoom: 1,
          visible: true,
          enableCloseButton: false,
          addressControl: false,
          panControl: true,
          zoomControl: true,
          fullscreenControl: false,
          motionTracking: false,
          motionTrackingControl: false,
        }
      );

      // Handle Street View status changes
      streetViewPanorama.addListener('status_changed', () => {
        const status = streetViewPanorama.getStatus();
        
        if (status === (window as any).google.maps.StreetViewStatus.OK) {
          setIsLoading(false);
          setError(null);
          
          // Get Street View metadata
          const location = streetViewPanorama.getPosition();
          if (location) {
            setStreetViewData({
              location: `${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}`,
              copyright: 'Google Street View',
              imageDate: new Date().getFullYear().toString()
            });
          }
        } else {
          setIsLoading(false);
          setError('Street View nie jest dostępny dla tej lokalizacji');
        }
      });

      // Handle panorama change
      streetViewPanorama.addListener('pano_changed', () => {
        console.log('📸 Street View panorama changed:', streetViewPanorama.getPano());
      });

      // Handle position change when user navigates
      streetViewPanorama.addListener('position_changed', () => {
        const newPosition = streetViewPanorama.getPosition();
        if (newPosition) {
          setStreetViewData(prev => ({
            ...prev,
            location: `${newPosition.lat().toFixed(6)}, ${newPosition.lng().toFixed(6)}`
          }));
        }
      });

      setPanorama(streetViewPanorama);

    } catch (err) {
      console.error('🗺️ Street View initialization error:', err);
      setIsLoading(false);
      setError('Błąd podczas ładowania Street View');
    }

    // Cleanup
    return () => {
      if (panorama) {
        (window as any).google.maps.event.clearInstanceListeners(panorama);
      }
    };
  }, [isOpen, position]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      streetViewRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Modal Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
              title="Zamknij Street View"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Powrót</span>
            </button>
            
            {businessName && (
              <div>
                <h2 className="text-lg font-semibold">{businessName}</h2>
                {address && (
                  <p className="text-sm text-gray-300">{address}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
              title={isFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Street View Container */}
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Ładowanie Street View...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="text-center text-white bg-red-900/50 rounded-lg p-6 max-w-md">
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Street View niedostępny</h3>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        )}

        <div 
          ref={streetViewRef} 
          className="w-full h-full"
        />

        {/* Street View Info Panel */}
        {!isLoading && !error && streetViewData.location && (
          <div className="absolute bottom-4 left-4 bg-black/80 text-white rounded-lg p-3 text-sm">
            <div className="space-y-1">
              <div>
                <span className="text-gray-300">Lokalizacja: </span>
                <span className="font-mono">{streetViewData.location}</span>
              </div>
              {streetViewData.copyright && (
                <div>
                  <span className="text-gray-300">© </span>
                  <span>{streetViewData.copyright}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreetViewModal;