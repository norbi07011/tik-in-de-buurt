import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import EnhancedVideoCard from './EnhancedVideoCard';

interface Video {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  uploadedBy: {
    _id: string;
    username: string;
    avatar?: string;
  };
  likes: string[];
  dislikes: string[];
  views: number;
  comments?: any[];
  createdAt: string;
  tags: string[];
  isPromoted: boolean;
}

interface EnhancedVideoFeedProps {
  className?: string;
  filter?: 'all' | 'following' | 'trending' | 'recent';
  userId?: string;
}

const EnhancedVideoFeed: React.FC<EnhancedVideoFeedProps> = ({ 
  className = '', 
  filter = 'all',
  userId 
}) => {
  const { t } = useTranslation();
  const { showToast } = useStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Mock data for demonstration
  const mockVideos: Video[] = [
    {
      _id: '1',
      title: 'Amazing Local Business Showcase',
      description: 'Discover the best local businesses in your neighborhood with this comprehensive showcase.',
      videoUrl: '/videos/sample1.mp4',
      thumbnailUrl: '/images/video-thumb1.jpg',
      uploadedBy: {
        _id: 'user1',
        username: 'LocalExplorer',
        avatar: '/images/avatar1.jpg'
      },
      likes: ['user2', 'user3', 'user4'],
      dislikes: [],
      views: 1250,
      comments: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      tags: ['local', 'business', 'showcase'],
      isPromoted: true
    },
    {
      _id: '2',
      title: 'Local Property Tour - Beautiful Apartment',
      description: 'Take a virtual tour of this stunning apartment available for rent in the city center.',
      videoUrl: '/videos/sample2.mp4',
      thumbnailUrl: '/images/video-thumb2.jpg',
      uploadedBy: {
        _id: 'user2',
        username: 'PropertyPro',
        avatar: '/images/avatar2.jpg'
      },
      likes: ['user1', 'user3'],
      dislikes: ['user5'],
      views: 850,
      comments: [],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      tags: ['property', 'apartment', 'tour'],
      isPromoted: false
    },
    {
      _id: '3',
      title: 'Freelancer Skills Demo - Web Development',
      description: 'Watch me build a responsive website from scratch using modern web technologies.',
      videoUrl: '/videos/sample3.mp4',
      thumbnailUrl: '/images/video-thumb3.jpg',
      uploadedBy: {
        _id: 'user3',
        username: 'WebDeveloper',
        avatar: '/images/avatar3.jpg'
      },
      likes: ['user1', 'user2', 'user4', 'user5'],
      dislikes: [],
      views: 2100,
      comments: [],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      tags: ['freelancer', 'web', 'development', 'tutorial'],
      isPromoted: false
    }
  ];

  const loadVideos = async (pageNum: number = 1, append: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      let filteredVideos = [...mockVideos];
      
      // Apply filters
      switch (filter) {
        case 'trending':
          filteredVideos = filteredVideos.sort((a, b) => {
            const aScore = a.views + a.likes.length * 10;
            const bScore = b.views + b.likes.length * 10;
            return bScore - aScore;
          });
          break;
        case 'recent':
          filteredVideos = filteredVideos.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'following':
          // TODO: Filter by followed users
          break;
        default:
          // All videos, sort by a mix of recency and popularity
          filteredVideos = filteredVideos.sort((a, b) => {
            const aScore = new Date(a.createdAt).getTime() / 1000000 + a.views + a.likes.length * 10;
            const bScore = new Date(b.createdAt).getTime() / 1000000 + b.views + b.likes.length * 10;
            return bScore - aScore;
          });
      }
      
      // Simulate pagination
      const startIndex = (pageNum - 1) * 10;
      const endIndex = startIndex + 10;
      const pageVideos = filteredVideos.slice(startIndex, endIndex);
      
      if (append) {
        setVideos(prev => [...prev, ...pageVideos]);
      } else {
        setVideos(pageVideos);
      }
      
      setHasMore(endIndex < filteredVideos.length);
      setPage(pageNum);
      
    } catch (error) {
      console.error('Failed to load video feed:', error);
      showToast(t('error_loading_videos') || 'Failed to load videos', 'error');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const loadMoreVideos = () => {
    if (hasMore && !isLoading) {
      loadVideos(page + 1, true);
    }
  };

  const handleVideoView = (videoId: string, watchTime: number, watchPercentage: number) => {
    // Update view count locally
    setVideos(prev => prev.map(video => 
      video._id === videoId 
        ? { ...video, views: video.views + 1 }
        : video
    ));
    
    console.log(`Video ${videoId} viewed: ${watchTime}s (${watchPercentage.toFixed(1)}%)`);
  };

  useEffect(() => {
    loadVideos(1, false);
  }, [filter]);

  if (isInitialLoad && isLoading) {
    return (
      <div className={`enhanced-video-feed ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-600">{t('loading_videos') || 'Loading videos...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-video-feed ${className}`}>
      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { key: 'all', label: t('All') || 'All' },
          { key: 'trending', label: t('Trending') || 'Trending' },
          { key: 'recent', label: t('Recent') || 'Recent' },
          { key: 'following', label: t('Following') || 'Following' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => window.location.hash = `#feed-${key}`} // Simple navigation simulation
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {videos.map((video) => (
            <EnhancedVideoCard
              key={video._id}
              video={video}
              currentUserId={userId}
              onVideoView={handleVideoView}
            />
          ))}
        </div>
      ) : !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📹</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('no_videos_found') || 'No videos found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('no_videos_description') || 'Be the first to share a video!'}
          </p>
        </div>
      )}
      
      {/* Loading More Indicator */}
      {isLoading && !isInitialLoad && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">{t('loading_more') || 'Loading more videos...'}</span>
        </div>
      )}
      
      {/* Load More Button */}
      {hasMore && !isLoading && videos.length > 0 && (
        <div className="text-center">
          <button 
            onClick={loadMoreVideos}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            disabled={isLoading}
          >
            {t('load_more') || 'Load More Videos'}
          </button>
        </div>
      )}
      
      {/* End Message */}
      {!hasMore && videos.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400">
            {t('no_more_videos') || 'You\'ve reached the end! No more videos to load.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoFeed;