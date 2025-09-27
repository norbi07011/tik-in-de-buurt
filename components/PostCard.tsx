import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PostWithBusiness, PostType, Page } from '../src/types';
import { StarIcon, ChatBubbleOvalLeftEllipsisIcon, ShareIcon, StarIconOutline } from './icons/Icons';
import { useStore } from '../src/store';
import { api } from '../src/api';

interface PostCardProps {
    post: PostWithBusiness;
    onUpdatePost?: (updatedPost: PostWithBusiness) => void;
    onCommentClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdatePost, onCommentClick }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);

    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false);
    const [currentLikeCount, setCurrentLikeCount] = useState(post.likeCount);

    const handleLike = async () => {
        (document.getElementById('star-sound') as HTMLAudioElement)?.play();
        const originalLikedState = isLiked;
        const originalLikeCount = currentLikeCount;

        // Optimistic UI update
        setIsLiked(!originalLikedState);
        setCurrentLikeCount(originalLikeCount + (!originalLikedState ? 1 : -1));

        try {
            const result = await api.togglePostLike(post.id, !originalLikedState);
            const updatedPost = {
                ...post,
                likeCount: result.likeCount,
                isLikedByCurrentUser: !originalLikedState,
            };
            // Update local state with confirmed data from API
            setCurrentLikeCount(result.likeCount);
            // Inform parent component of the change
            if (onUpdatePost) {
                onUpdatePost(updatedPost);
            }
        } catch (error) {
            // Revert on error
            setIsLiked(originalLikedState);
            setCurrentLikeCount(originalLikeCount);
            console.error("Failed to like post:", error);
        }
    };
    
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Post by ${t(post.business.nameKey)}`,
                    text: post.content,
                    url: window.location.href, // Or a direct link to the post if available
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            alert('Share functionality is not supported on this browser.');
        }
    };

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min";
        return Math.floor(seconds) + "s";
    };

    return (
        <div className="glass-card-style p-5 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <img 
                    src={post.business.logoUrl} 
                    alt={t(post.business.nameKey)} 
                    className="w-12 h-12 rounded-full cursor-pointer"
                    onClick={() => navigate(Page.BusinessProfile, post.business.id)}
                />
                <div>
                    <h3 
                        className="font-bold text-[var(--text-primary)] cursor-pointer hover:underline"
                        onClick={() => navigate(Page.BusinessProfile, post.business.id)}
                    >
                        {t(post.business.nameKey)}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">{timeAgo(post.createdAt)} ago</p>
                </div>
            </div>

            {/* Content */}
            <p className="text-[var(--text-secondary)] whitespace-pre-line mb-4">{post.content}</p>

            {post.type === PostType.Photo && post.mediaUrl && (
                <div className="rounded-lg overflow-hidden border border-[var(--border-color-alt)]">
                    <img src={post.mediaUrl} alt="Post media" className="w-full object-cover" />
                </div>
            )}
             {post.type === PostType.Video && post.mediaUrl && (
                <div className="rounded-lg overflow-hidden border border-[var(--border-color-alt)]">
                    <video src={post.mediaUrl} controls className="w-full" />
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-3 border-t glass-card-divider flex justify-around items-center text-[var(--text-secondary)]">
                <button 
                    onClick={handleLike} 
                    className={`flex items-center gap-2 transition-colors text-sm font-semibold ${isLiked ? 'text-yellow-400 hover:text-yellow-300' : 'text-[var(--text-secondary)] hover:text-yellow-400'}`}
                >
                    {isLiked ? <StarIcon className="w-5 h-5" /> : <StarIconOutline className="w-5 h-5" />}
                    {currentLikeCount}
                </button>
                 <button onClick={onCommentClick} className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors text-sm font-semibold">
                    <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" /> {post.commentCount}
                </button>
                 <button onClick={handleShare} className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors text-sm font-semibold">
                    <ShareIcon className="w-5 h-5" /> {t('share')}
                </button>
            </div>
        </div>
    );
};

export default PostCard;
