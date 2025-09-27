import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import { FetchStatus } from '../src/types';
import type { Comment } from '../src/types';
import { XMarkIcon, PaperAirplaneIcon } from './icons/Icons';
import { useStore } from '../src/store';
import ReviewSkeleton from './skeletons/ReviewSkeleton';

const ErrorDisplay: React.FC<{ message: string, onRetry: () => void }> = ({ message, onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="col-span-full flex flex-col items-center justify-center text-center h-full text-[var(--text-primary)] p-8">
            <h3 className="text-xl font-bold text-red-500 mb-2">{t('error_loading_data')}</h3>
            <p className="text-[var(--text-secondary)] mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="px-6 py-2 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300"
            >
                {t('try_again')}
            </button>
        </div>
    );
};

const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => {
    return (
        <div className="flex gap-3">
            <img src={comment.avatarUrl} alt={comment.author} className="w-10 h-10 rounded-full object-cover" />
            <div className="bg-[var(--background)] p-3 rounded-lg flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{comment.author}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(comment.date).toLocaleDateString()}</p>
                </div>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">{comment.text}</p>
            </div>
        </div>
    );
};

const CommentsPanel: React.FC<{ 
    adId?: number;
    postId?: number;
    onClose: () => void; 
    onCommentPosted: () => void;
}> = ({ adId, postId, onClose, onCommentPosted }) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState<Comment[]>([]);
    const [status, setStatus] = useState<FetchStatus>(FetchStatus.Idle);
    const [error, setError] = useState<Error | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const user = useStore(state => state.user);
    const commentsEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    const fetchComments = useCallback(async () => {
        if (!adId && !postId) return;
        setStatus(FetchStatus.Loading);
        setError(null);
        try {
            const fetchedComments = adId 
                ? await api.fetchCommentsForAd(adId)
                : await api.fetchCommentsForPost(postId!);
            setComments(fetchedComments);
            setStatus(FetchStatus.Success);
        } catch (err) {
            setError(err as Error);
            setStatus(FetchStatus.Error);
        }
    }, [adId, postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);
    
    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user || (!adId && !postId)) return;
        setIsPosting(true);
        try {
            const target = adId ? { adId } : { postId };
            const postedComment = await api.postComment(target, newComment, user.name, "https://i.imgur.com/sC3bL2T.png"); // Using a placeholder avatar
            setComments(prev => [...prev, postedComment]);
            onCommentPosted();
            setNewComment('');
        } catch (err) {
            // Handle error, maybe show a toast
            console.error("Failed to post comment", err);
        } finally {
            setIsPosting(false);
        }
    };
    
    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />);
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={fetchComments} />;
            case FetchStatus.Success:
                if (comments.length === 0) {
                    return <div className="text-center text-[var(--text-secondary)] py-10">{t('no_comments_yet')}</div>;
                }
                return (
                    <div className="space-y-4">
                        {comments.map(c => <CommentCard key={c.id} comment={c} />)}
                    </div>
                );
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-30 animate-fade-in" onClick={onClose}></div>
            <div className="fixed bottom-0 left-0 right-0 z-40 h-[70vh] bg-[var(--background-alt)] rounded-t-2xl flex flex-col shadow-2xl animate-slide-up">
                <header className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h2 className="font-bold text-lg text-[var(--text-primary)]">{t('comments')}</h2>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                    {renderContent()}
                    <div ref={commentsEndRef} />
                </div>
                <footer className="p-4 border-t border-[var(--border-color)] bg-[var(--background)]">
                    <form onSubmit={handlePostComment} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('add_a_comment')}
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-full py-2 px-4 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            disabled={!user || isPosting}
                        />
                        <button type="submit" disabled={!user || isPosting || !newComment.trim()} className="p-3 bg-[var(--primary)] text-[var(--primary-text)] rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </footer>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </>
    );
};

export default CommentsPanel;
