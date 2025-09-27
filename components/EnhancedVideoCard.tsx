import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import VideoPlayer from './VideoPlayer';
import { HeartIcon, ChatBubbleLeftIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

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
  comments?: Comment[];
  createdAt: string;
  tags: string[];
  isPromoted: boolean;
}

interface Comment {
  _id: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

interface EnhancedVideoCardProps {
  video: Video;
  currentUserId?: string;
  onVideoView?: (videoId: string, watchTime: number, watchPercentage: number) => void;
}

const EnhancedVideoCard: React.FC<EnhancedVideoCardProps> = ({ 
  video, 
  currentUserId, 
  onVideoView 
}) => {
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes.length);
  const [dislikeCount, setDislikeCount] = useState(video.dislikes.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(video.comments || []);
  const [newComment, setNewComment] = useState('');
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      setIsLiked(video.likes.includes(currentUserId));
      setIsDisliked(video.dislikes.includes(currentUserId));
    }
  }, [currentUserId, video.likes, video.dislikes]);

  const handleLike = async () => {
    if (!currentUserId) return;
    
    try {
      // For now, simulate the like action
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setIsDisliked(false);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await api.likeVideo(video._id);
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleDislike = async () => {
    if (!currentUserId) return;
    
    try {
      // For now, simulate the dislike action
      const newIsDisliked = !isDisliked;
      setIsDisliked(newIsDisliked);
      setIsLiked(false);
      setDislikeCount(prev => newIsDisliked ? prev + 1 : prev - 1);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await api.dislikeVideo(video._id);
    } catch (error) {
      console.error('Error disliking video:', error);
    }
  };

  const handleVideoTimeUpdate = async (currentTime: number, duration: number) => {
    const watchPercentage = (currentTime / duration) * 100;
    
    // Track view when user watches at least 30% or 30 seconds
    if (!viewTracked && (watchPercentage >= 30 || currentTime >= 30)) {
      setViewTracked(true);
      
      try {
        // TODO: Replace with actual API call when backend is ready
        // await api.trackVideoView(video._id, currentTime, watchPercentage);
        
        onVideoView?.(video._id, currentTime, watchPercentage);
      } catch (error) {
        console.error('Error tracking video view:', error);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    try {
      // For now, simulate adding a comment
      const newCommentObj: Comment = {
        _id: Date.now().toString(),
        userId: currentUserId,
        username: 'Current User', // TODO: Get from user context
        text: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      
      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await api.addVideoComment(video._id, newComment.trim());
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description || '',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  return (
    <div className="enhanced-video-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative">
        <VideoPlayer
          videoUrl={video.videoUrl}
          posterUrl={video.thumbnailUrl}
          onTimeUpdate={handleVideoTimeUpdate}
          className="w-full aspect-video"
        />
        
        {/* Video Overlay Info */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          <EyeIcon className="inline w-4 h-4 mr-1" />
          {video.views.toLocaleString()}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        {/* Title and Description */}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
          {video.title}
        </h3>
        
        {video.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
            {video.description}
          </p>
        )}

        {/* Author Info */}
        <div className="flex items-center mb-4">
          {video.uploadedBy.avatar && (
            <img
              src={video.uploadedBy.avatar}
              alt={video.uploadedBy.username}
              className="w-8 h-8 rounded-full mr-3"
            />
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {video.uploadedBy.username}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center space-x-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!currentUserId}
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              } transition-colors`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-6 h-6" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* Comments Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <ChatBubbleLeftIcon className="w-6 h-6" />
              <span className="text-sm">{comments.length}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
            >
              <ShareIcon className="w-6 h-6" />
              <span className="text-sm">{t('Share')}</span>
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 border-t pt-4">
            {/* Add Comment Form */}
            {currentUserId && (
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('Add a comment...')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('Post')}
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3">
                  {comment.avatar && (
                    <img
                      src={comment.avatar}
                      alt={comment.username}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {comment.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVideoCard;