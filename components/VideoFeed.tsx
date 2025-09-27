import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import EnhancedVideoCard from './EnhancedVideoCard';

interface Video {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail: string;
    authorId: number;
    businessId?: number;
    likes: number;
    views: number;
    tags: string[];
    createdAt: string;
}

interface VideoFeedProps {
    className?: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ className = '' }) => {
    const { t } = useTranslation();
    const { showToast, isFetching } = useStore();
    const [videos, setVideos] = useState<Video[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const loadVideos = async (pageNum: number = 1, append: boolean = false) => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            const response = await api.getFeed(pageNum);
            
            if (append) {
                setVideos(prev => [...prev, ...response.videos]);
            } else {
                setVideos(response.videos);
            }
            
            setHasMore(response.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to load video feed:', error);
            showToast(t('error_loading_videos') || 'Failed to load videos', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreVideos = () => {
        if (hasMore && !isLoading) {
            loadVideos(page + 1, true);
        }
    };

    useEffect(() => {
        loadVideos(1, false);
    }, []);

    return (
        <div className={`video-feed ${className}`}>
            <div className="video-grid">
                {videos.map((video) => (
                    <div key={video.id} className="video-card">
                        <div className="video-thumbnail">
                            <img src={video.thumbnail} alt={video.title} />
                            <div className="video-overlay">
                                <button className="play-button">▶️</button>
                            </div>
                        </div>
                        <div className="video-info">
                            <h3 className="video-title">{video.title}</h3>
                            <p className="video-description">{video.description}</p>
                            <div className="video-stats">
                                <span className="views">👀 {video.views}</span>
                                <span className="likes">❤️ {video.likes}</span>
                            </div>
                            <div className="video-tags">
                                {video.tags.map((tag, index) => (
                                    <span key={index} className="tag">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {isLoading && (
                <div className="loading-indicator">
                    <div className="spinner">⏳</div>
                    <span>{t('loading_videos') || 'Loading videos...'}</span>
                </div>
            )}
            
            {hasMore && !isLoading && videos.length > 0 && (
                <div className="load-more-container">
                    <button 
                        onClick={loadMoreVideos}
                        className="load-more-button"
                        disabled={isLoading}
                    >
                        {t('load_more') || 'Load More'}
                    </button>
                </div>
            )}
            
            {!hasMore && videos.length > 0 && (
                <div className="end-message">
                    {t('no_more_videos') || 'No more videos to load'}
                </div>
            )}
        </div>
    );
};

export default VideoFeed;