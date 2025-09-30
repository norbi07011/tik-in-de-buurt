import React, { useState, useEffect } from 'react';
import { PlayIcon, EyeIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/solid';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  category: string;
  uploadDate: string;
  isLive?: boolean;
  similarity?: number;
}

interface VideoRecommendationsProps {
  currentVideoId?: string;
  userId?: string;
  onVideoSelect: (videoId: string) => void;
  maxRecommendations?: number;
  showSimilarity?: boolean;
  mode?: 'similar' | 'personalized' | 'trending';
}

const VideoRecommendations: React.FC<VideoRecommendationsProps> = ({
  currentVideoId,
  userId,
  onVideoSelect,
  maxRecommendations = 10,
  showSimilarity = false,
  mode = 'personalized'
}) => {
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'similar' | 'personalized' | 'trending'>(mode);

  useEffect(() => {
    fetchRecommendations();
  }, [currentVideoId, userId, currentMode]);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const fetchRecommendations = async () => {
    if (!userId && currentMode === 'personalized') return;
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      switch (currentMode) {
        case 'similar':
          endpoint = `/api/video-analytics/enhanced/similar/${currentVideoId}`;
          break;
        case 'trending':
          endpoint = '/api/video-analytics/enhanced/trending';
          break;
        case 'personalized':
        default:
          endpoint = `/api/video-analytics/enhanced/recommendations/${userId}`;
          break;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDuration = (duration: string): string => {
    // Convert seconds to MM:SS format if needed
    if (!isNaN(Number(duration))) {
      const seconds = parseInt(duration);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return duration;
  };

  const getModeTitle = (): string => {
    switch (currentMode) {
      case 'similar':
        return 'Podobne filmy';
      case 'trending':
        return 'Popularne teraz';
      case 'personalized':
      default:
        return 'Rekomendowane dla Ciebie';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {getModeTitle()}
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="bg-gray-300 dark:bg-gray-600 rounded-lg w-32 h-20"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-300 dark:bg-gray-600 rounded h-4 w-3/4"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 rounded h-3 w-1/2"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 rounded h-3 w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <PlayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Brak dostępnych rekomendacji
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {getModeTitle()}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentMode('personalized')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              currentMode === 'personalized'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Dla Ciebie
          </button>
          <button
            onClick={() => setCurrentMode('trending')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              currentMode === 'trending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Popularne
          </button>
          {currentVideoId && (
            <button
              onClick={() => setCurrentMode('similar')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                currentMode === 'similar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Podobne
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, maxRecommendations).map((video) => (
          <div
            key={video.id}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md"
            onClick={() => onVideoSelect(video.id)}
          >
            <div className="flex space-x-3">
              {/* Thumbnail */}
              <div className="relative flex-shrink-0">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-32 h-20 object-cover rounded-lg bg-gray-200 dark:bg-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-video.jpg';
                  }}
                />
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                  {formatDuration(video.duration)}
                </div>
                {video.isLive && (
                  <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 rounded">
                    LIVE
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayIcon className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {video.title}
                </h4>
                
                <div className="flex items-center space-x-2 mt-1">
                  <img
                    src={video.creator.avatar}
                    alt={video.creator.name}
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {video.creator.name}
                  </span>
                  {video.creator.verified && (
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="h-3 w-3" />
                    <span>{formatViews(video.views)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="h-3 w-3" />
                    <span>{formatViews(video.likes)}</span>
                  </div>
                  <span>{video.uploadDate}</span>
                  {showSimilarity && video.similarity && (
                    <span className="text-blue-500">
                      {Math.round(video.similarity * 100)}% podobne
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {video.category}
                  </span>
                  
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                      title="Polub film"
                      aria-label="Polub film"
                    >
                      <HeartIcon className="h-4 w-4 text-gray-500 hover:text-red-500" />
                    </button>
                    <button 
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                      title="Udostępnij film"
                      aria-label="Udostępnij film"
                    >
                      <ShareIcon className="h-4 w-4 text-gray-500 hover:text-blue-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={fetchRecommendations}
        className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
      >
        Odśwież rekomendacje
      </button>
    </div>
  );
};

export default VideoRecommendations;