import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import { FetchStatus, PostWithBusiness } from '../src/types';
import PostCard from '../components/PostCard';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton';
import { SearchIcon } from '../components/icons/Icons';
import CommentsPanel from '../components/CommentsPanel';
import { useDataFetcher } from '../hooks/useDataFetcher';

const ScrollAnimationWrapper: React.FC<{ children: React.ReactNode, delay?: number }> = ({ children, delay = 0 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { rootMargin: '0px', threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, []);

    return (
        /* eslint-disable-next-line no-inline-styles */
        <div ref={ref} className={`scroll-animate ${isVisible ? 'is-visible' : ''}`} style={{['--delay' as any]: `${delay}ms`}}>
            {children}
        </div>
    );
};


const WallPage: React.FC = () => {
    const { t } = useTranslation();
    const [postsData, setPostsData] = useState<PostWithBusiness[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'most_liked'>('newest');
    const [commentsPostId, setCommentsPostId] = useState<number | null>(null);

    const fetcher = useCallback(() => api.fetchPosts({ search: searchTerm, sortBy }), [searchTerm, sortBy]);
    
    const { data: posts, status, error, refetch } = useDataFetcher(fetcher);
    
    useEffect(() => {
        if (posts) {
            // Filter out video posts from the main wall page as requested
            setPostsData(posts.filter(p => p.type !== 'video'));
        }
    }, [posts]);


    const handlePostUpdate = (updatedPost: PostWithBusiness) => {
        setPostsData(prevPosts => {
            const newPosts = prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
            if (sortBy === 'most_liked') {
                newPosts.sort((a, b) => b.likeCount - a.likeCount);
            }
            return newPosts;
        });
    };

    const handleCommentPosted = (postId: number) => {
        const targetPost = postsData.find(p => p.id === postId);
        if (targetPost) {
            handlePostUpdate({ ...targetPost, commentCount: targetPost.commentCount + 1 });
        }
    };

    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: 3 }).map((_, i) => <div key={i} className="masonry-item"><PostCardSkeleton /></div>);
            case FetchStatus.Success:
                if (postsData.length === 0) {
                    return <div className="text-center text-[var(--text-secondary)] py-20 col-span-full">No posts have been made yet.</div>;
                }
                return postsData.map((post, index) => (
                    <div key={post.id} className="masonry-item">
                        <ScrollAnimationWrapper delay={index * 50}>
                            <PostCard 
                                post={post} 
                                onUpdatePost={handlePostUpdate} 
                                onCommentClick={() => setCommentsPostId(post.id)}
                            />
                        </ScrollAnimationWrapper>
                    </div>
                ));
            case FetchStatus.Error:
                return <div className="text-center text-red-500 py-20 col-span-full">{t('error_loading_data')}</div>;
        }
    };

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)]">{t('wall')}</h1>
                <p className="text-[var(--text-secondary)] mt-2 max-w-2xl mx-auto">See the latest updates from local businesses.</p>
            </header>

            <div className="max-w-2xl mx-auto mb-8 space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('search_posts')}
                        className="w-full bg-[var(--background-alt)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 flex-shrink-0 sm:ml-4">
                     <span className="text-sm font-semibold text-[var(--text-secondary)]">{t('sort_by')}:</span>
                     <button
                        onClick={() => setSortBy('newest')}
                        className={`px-3 py-1 text-sm rounded-full ${sortBy === 'newest' ? 'bg-[var(--primary)] text-[var(--primary-text)]' : 'bg-[var(--border-color-alt)] text-[var(--text-secondary)]'}`}
                    >
                        {t('sort_by_newest')}
                    </button>
                    <button
                        onClick={() => setSortBy('most_liked')}
                        className={`px-3 py-1 text-sm rounded-full ${sortBy === 'most_liked' ? 'bg-[var(--primary)] text-[var(--primary-text)]' : 'bg-[var(--border-color-alt)] text-[var(--text-secondary)]'}`}
                    >
                        {t('sort_by_most_liked')}
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto masonry-container">
                {renderContent()}
            </div>
            
            {commentsPostId !== null && (
                <CommentsPanel 
                    postId={commentsPostId} 
                    onClose={() => setCommentsPostId(null)} 
                    onCommentPosted={() => handleCommentPosted(commentsPostId)}
                />
            )}
        </div>
    );
};

export default WallPage;
