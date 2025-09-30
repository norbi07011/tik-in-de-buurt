import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  Cog6ToothIcon,
  HandThumbUpIcon,
  ShareIcon,
  BookmarkIcon,
  EyeIcon
} from '@heroicons/react/24/solid';
import './VideoPlayer.css';

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  businessId?: string;
  category?: string;
  posterUrl?: string;
  autoplay?: boolean;
  controls?: boolean;
  playbackSpeed?: number[];
  qualityOptions?: string[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVideoEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  className?: string;
  showAnalytics?: boolean;
  enableRecommendations?: boolean;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  videoUrl,
  videoId,
  businessId,
  category = 'general',
  posterUrl,
  autoplay = false,
  controls = true,
  playbackSpeed = [0.5, 0.75, 1, 1.25, 1.5, 2],
  qualityOptions = ['360p', '480p', '720p', '1080p'],
  onTimeUpdate,
  onVideoEnd,
  onPlay,
  onPause,
  onLike,
  onShare,
  onBookmark,
  className = '',
  showAnalytics = false,
  enableRecommendations = true
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Basic video states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Enhanced states
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState('720p');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Analytics & Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const [lastProgressReport, setLastProgressReport] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  
  // Refs for analytics
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Analytics tracking function
  const trackVideoEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/video-analytics/enhanced/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          videoId,
          businessId,
          category,
          ...eventData
        })
      });

      if (!response.ok) {
        console.warn('Failed to track video event:', eventData);
      }
    } catch (error) {
      console.warn('Error tracking video event:', error);
    }
  };

  // Track interaction
  const trackInteraction = async (action: string) => {
    try {
      await fetch('/api/video-analytics/enhanced/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          videoId,
          businessId,
          action,
          category
        })
      });
    } catch (error) {
      console.warn('Error tracking interaction:', error);
    }
  };

  // Video event handlers with analytics
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      trackVideoEvent({
        event: 'loadedMetadata',
        totalDuration: video.duration,
        quality: currentQuality,
        playbackRate: currentSpeed
      });
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      setCurrentTime(currentTime);
      onTimeUpdate?.(currentTime, video.duration);

      // Track progress every 25%
      const progress = (currentTime / video.duration) * 100;
      if (progress >= lastProgressReport + 25) {
        setLastProgressReport(progress);
        trackVideoEvent({
          event: 'progress',
          currentTime,
          totalDuration: video.duration,
          progress,
          quality: currentQuality,
          playbackRate: currentSpeed
        });
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setWatchStartTime(Date.now());
      onPlay?.();
      trackVideoEvent({
        event: 'play',
        currentTime: video.currentTime,
        quality: currentQuality,
        playbackRate: currentSpeed
      });
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
      
      if (watchStartTime) {
        const watchTime = (Date.now() - watchStartTime) / 1000;
        trackVideoEvent({
          event: 'pause',
          currentTime: video.currentTime,
          totalDuration: video.duration,
          watchTime,
          quality: currentQuality,
          playbackRate: currentSpeed
        });
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
      
      if (watchStartTime) {
        const watchTime = (Date.now() - watchStartTime) / 1000;
        trackVideoEvent({
          event: 'complete',
          currentTime: video.currentTime,
          totalDuration: video.duration,
          watchTime,
          quality: currentQuality,
          playbackRate: currentSpeed
        });
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoId, businessId, category, currentQuality, currentSpeed, lastProgressReport, watchStartTime]);

  // Enhanced control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      
      trackVideoEvent({
        event: 'skip',
        skipAmount: seconds,
        newTime,
        currentTime: newTime
      });
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setCurrentSpeed(rate);
      setShowSpeedMenu(false);
      
      trackVideoEvent({
        event: 'playbackRateChange',
        newRate: rate,
        currentTime: videoRef.current.currentTime
      });
    }
  };

  const changeQuality = (quality: string) => {
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    
    trackVideoEvent({
      event: 'qualityChange',
      newQuality: quality,
      currentTime: videoRef.current?.currentTime || 0
    });
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    trackInteraction(isLiked ? 'unlike' : 'like');
    onLike?.();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Sprawdź to wideo!',
        url: window.location.href
      });
    }
    trackInteraction('share');
    onShare?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    trackInteraction(isBookmarked ? 'unbookmark' : 'bookmark');
    onBookmark?.();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleProgressChange = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        className="w-full h-full object-cover"
        autoPlay={autoplay}
        muted={isMuted}
        onClick={togglePlay}
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Analytics overlay */}
      {showAnalytics && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded text-sm">
          <div className="flex items-center space-x-2">
            <EyeIcon className="w-4 h-4" />
            <span>{viewCount} views</span>
          </div>
        </div>
      )}

      {/* Enhanced Controls */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Video progress"
              title="Video progress"
            />
            <div className="flex justify-between text-white text-xs mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>

              {/* Skip controls */}
              <button
                onClick={() => skipTime(-10)}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Skip backward 10 seconds"
              >
                <BackwardIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => skipTime(10)}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Skip forward 10 seconds"
              >
                <ForwardIcon className="w-5 h-5" />
              </button>

              {/* Volume controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-5 h-5" />
                  ) : (
                    <SpeakerWaveIcon className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  aria-label="Volume control"
                  title="Volume control"
                />
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              {/* Engagement controls */}
              <button
                onClick={handleLike}
                className={`transition-colors ${
                  isLiked ? 'text-red-400' : 'text-white hover:text-red-400'
                }`}
                aria-label="Like video"
              >
                <HandThumbUpIcon className="w-5 h-5" />
              </button>

              <button
                onClick={handleBookmark}
                className={`transition-colors ${
                  isBookmarked ? 'text-yellow-400' : 'text-white hover:text-yellow-400'
                }`}
                aria-label="Bookmark video"
              >
                <BookmarkIcon className="w-5 h-5" />
              </button>

              <button
                onClick={handleShare}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Share video"
              >
                <ShareIcon className="w-5 h-5" />
              </button>

              {/* Settings menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-blue-400 transition-colors"
                  aria-label="Video settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-8 right-0 bg-black/90 rounded-lg p-3 min-w-[200px] z-50">
                    <div className="text-white text-sm space-y-3">
                      {/* Playback speed */}
                      <div>
                        <label className="block mb-1">Prędkość odtwarzania:</label>
                        <select
                          value={currentSpeed}
                          onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                          className="w-full bg-gray-700 rounded px-2 py-1 text-white"
                          aria-label="Playback speed selection"
                          title="Select playback speed"
                        >
                          {playbackSpeed.map(speed => (
                            <option key={speed} value={speed}>
                              {speed === 1 ? '1x (normalna)' : `${speed}x`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quality */}
                      <div>
                        <label className="block mb-1">Jakość:</label>
                        <select
                          value={currentQuality}
                          onChange={(e) => changeQuality(e.target.value)}
                          className="w-full bg-gray-700 rounded px-2 py-1 text-white"
                          aria-label="Video quality selection"
                          title="Select video quality"
                        >
                          <option value="auto">Automatyczna</option>
                          {qualityOptions.map(quality => (
                            <option key={quality} value={quality}>
                              {quality}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;