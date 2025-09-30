import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AdvancedVideoPlayer.css';
import { 
  PlayIcon as Play, 
  PauseIcon as Pause,
  SpeakerWaveIcon as VolumeUp,
  SpeakerXMarkIcon as VolumeOff,
  ArrowsPointingOutIcon as Fullscreen,
  ArrowsPointingInIcon as ExitFullscreen,
  CogIcon as Settings,
  ForwardIcon as Forward,
  BackwardIcon as Backward
} from './icons/Icons';

interface VideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  autoplay?: boolean;
  controls?: boolean;
  playbackSpeed?: number[];
  qualityOptions?: string[];
  onTimeUpdate?: (currentTime: number) => void;
  onVideoEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  onPlaybackSpeedChange?: (speed: number) => void;
  className?: string;
}

interface VideoAnalytics {
  watchTime: number;
  totalDuration: number;
  playCount: number;
  pauseCount: number;
  seekCount: number;
  volumeChanges: number;
  speedChanges: number;
  completionRate: number;
  averageSession: number;
  bufferEvents: number;
}

export const AdvancedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  autoplay = false,
  controls = true,
  playbackSpeed = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
  qualityOptions = ['360p', '720p', '1080p'],
  onTimeUpdate,
  onVideoEnd,
  onPlay,
  onPause,
  onVolumeChange,
  onPlaybackSpeedChange,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState('720p');
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<VideoAnalytics>({
    watchTime: 0,
    totalDuration: 0,
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    volumeChanges: 0,
    speedChanges: 0,
    completionRate: 0,
    averageSession: 0,
    bufferEvents: 0
  });

  // Control visibility timer
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setAnalytics(prev => ({ ...prev, pauseCount: prev.pauseCount + 1 }));
      onPause?.();
    } else {
      videoRef.current.play();
      setAnalytics(prev => ({ ...prev, playCount: prev.playCount + 1 }));
      onPlay?.();
    }
  }, [isPlaying, onPause, onPlay]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    onTimeUpdate?.(current);
    
    // Update analytics
    setAnalytics(prev => ({
      ...prev,
      watchTime: prev.watchTime + 0.1, // Approximation
      completionRate: duration > 0 ? (current / duration) * 100 : 0
    }));
  }, [duration, onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    const videoDuration = videoRef.current.duration;
    setDuration(videoDuration);
    setAnalytics(prev => ({ ...prev, totalDuration: videoDuration }));
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setAnalytics(prev => ({ ...prev, seekCount: prev.seekCount + 1 }));
  }, [duration]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    videoRef.current.volume = clampedVolume;
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
    setAnalytics(prev => ({ ...prev, volumeChanges: prev.volumeChanges + 1 }));
    onVolumeChange?.(clampedVolume);
  }, [onVolumeChange]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
    setAnalytics(prev => ({ ...prev, volumeChanges: prev.volumeChanges + 1 }));
  }, [isMuted, volume]);

  const changePlaybackSpeed = useCallback((speed: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = speed;
    setCurrentSpeed(speed);
    setAnalytics(prev => ({ ...prev, speedChanges: prev.speedChanges + 1 }));
    onPlaybackSpeedChange?.(speed);
  }, [onPlaybackSpeedChange]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [isFullscreen]);

  const skipForward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, onVideoEnd]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, skipBackward, skipForward, handleVolumeChange, volume, toggleMute, toggleFullscreen]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        autoPlay={autoplay}
        className="w-full h-full object-contain"
        preload="metadata"
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controls Overlay */}
      {controls && (
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              title={isPlaying ? "Wstrzymaj" : "Odtwarzaj"}
              aria-label={isPlaying ? "Wstrzymaj odtwarzanie" : "Odtwarzaj video"}
              className="bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-70 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>

          {/* Skip Buttons */}
          <button
            onClick={skipBackward}
            title="Cofnij 10 sekund"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
          >
            <Backward className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={skipForward}
            title="Przewiń 10 sekund"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
          >
            <Forward className="w-6 h-6 text-white" />
          </button>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-4"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                data-progress={`${progressPercentage}%`}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white hover:text-blue-400" />
                  ) : (
                    <Play className="w-6 h-6 text-white hover:text-blue-400" />
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={toggleMute}
                    title={isMuted ? "Włącz dźwięk" : "Wycisz"}
                    aria-label={isMuted ? "Włącz dźwięk" : "Wycisz dźwięk"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeOff className="w-6 h-6 text-white hover:text-blue-400" />
                    ) : (
                      <VolumeUp className="w-6 h-6 text-white hover:text-blue-400" />
                    )}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    title="Kontrola głośności"
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Settings Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    title="Ustawienia odtwarzacza"
                    className="text-white hover:text-blue-400"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  
                  {showSettings && (
                    <div className="absolute bottom-8 right-0 bg-black bg-opacity-90 rounded-lg p-4 min-w-48">
                      {/* Playback Speed */}
                      <div className="mb-4">
                        <h4 className="text-white text-sm font-semibold mb-2">Prędkość</h4>
                        <div className="space-y-1">
                          {playbackSpeed.map(speed => (
                            <button
                              key={speed}
                              onClick={() => changePlaybackSpeed(speed)}
                              className={`block w-full text-left px-2 py-1 text-sm rounded ${
                                currentSpeed === speed 
                                  ? 'bg-blue-500 text-white' 
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality */}
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-2">Jakość</h4>
                        <div className="space-y-1">
                          {qualityOptions.map(quality => (
                            <button
                              key={quality}
                              onClick={() => setCurrentQuality(quality)}
                              className={`block w-full text-left px-2 py-1 text-sm rounded ${
                                currentQuality === quality 
                                  ? 'bg-blue-500 text-white' 
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {quality}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <ExitFullscreen className="w-6 h-6 text-white hover:text-blue-400" />
                  ) : (
                    <Fullscreen className="w-6 h-6 text-white hover:text-blue-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedVideoPlayer;