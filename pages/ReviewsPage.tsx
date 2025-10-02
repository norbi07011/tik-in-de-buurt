import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import type { Review } from '../src/types';
import { FetchStatus, Page } from '../src/types';
import { StarIcon } from '../components/icons/Icons';
import ReviewSkeleton from '../components/skeletons/ReviewSkeleton';
import { useStore } from '../src/store';

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    const navigate = useStore(state => state.navigate);
    const isBusinessReview = review.authorType === 'business';

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} />
        ));
    };
    
    const AuthorName = () => {
        if (isBusinessReview && review.authorBusinessId) {
            return (
                 <button 
                    onClick={() => navigate(Page.BusinessProfile, review.authorBusinessId)}
                    className="font-bold text-[var(--text-primary)] hover:underline hover:text-[var(--primary)] transition-colors"
                >
                    {review.author}
                </button>
            )
        }
        return <p className="font-bold text-[var(--text-primary)]">{review.author}</p>
    }

    return (
        <div className="bg-[var(--background-alt)] p-4 rounded-lg border border-[var(--border-color-alt)] flex gap-4">
            <img src={review.avatarUrl} alt={review.author} className="w-12 h-12 rounded-full object-cover" />
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <AuthorName />
                        <p className="text-xs text-[var(--text-muted)]">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex">{renderStars(review.rating)}</div>
                </div>
                <p className="text-[var(--text-secondary)] mt-2 text-sm">{review.text}</p>
            </div>
        </div>
    );
};

const ErrorDisplay: React.FC<{ message: string, onRetry: () => void }> = ({ message, onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="col-span-full flex flex-col items-center justify-center text-center text-[var(--text-primary)] p-8 bg-[var(--card-bg)] rounded-lg">
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

const ReviewForm: React.FC<{ businessId: number, authorBusinessId: number, onSubmitSuccess: () => void }> = ({ businessId, authorBusinessId, onSubmitSuccess }) => {
    const { t } = useTranslation();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !text.trim()) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await api.postBusinessReview(businessId, authorBusinessId, rating, text);
            setRating(0);
            setText('');
            onSubmitSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to post review');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="glass-card-style p-6 mb-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('write_a_review')}</h3>
            <form onSubmit={handleSubmit}>
                <div className="flex items-center mb-4">
                    {Array.from({ length: 5 }).map((_, i) => {
                        const starValue = i + 1;
                        return (
                             <StarIcon
                                key={i}
                                className={`w-8 h-8 cursor-pointer transition-colors ${starValue <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-600'}`}
                                onClick={() => setRating(starValue)}
                                onMouseEnter={() => setHoverRating(starValue)}
                                onMouseLeave={() => setHoverRating(0)}
                            />
                        )
                    })}
                </div>
                 <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="Share details of your own experience at this place"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                 <div className="text-right mt-4">
                     <button
                        type="submit"
                        disabled={isSubmitting || rating === 0 || !text.trim()}
                        className="px-6 py-2 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? t('loading') : t('submit_review')}
                    </button>
                </div>
            </form>
        </div>
    )
}


const BusinessReviews: React.FC<{ businessId: number }> = ({ businessId }) => {
    const { t } = useTranslation();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [status, setStatus] = useState<FetchStatus>(FetchStatus.Idle);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useStore();
    
    const canLeaveReview = user?.businessId && parseInt(user.businessId) !== businessId;

    const fetchReviews = useCallback(async () => {
        setStatus(FetchStatus.Loading);
        setError(null);
        try {
            const fetchedReviews = await api.fetchReviewsForBusiness(businessId);
            setReviews(fetchedReviews.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setStatus(FetchStatus.Success);
        } catch (err) {
            setError(err as Error);
            setStatus(FetchStatus.Error);
        }
    }, [businessId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);
    
    const businessReviews = reviews.filter(r => r.authorType === 'business');
    const customerReviews = reviews.filter(r => r.authorType !== 'business');

    const renderReviewList = (reviewList: Review[]) => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: 3 }).map((_, index) => <ReviewSkeleton key={index} />);
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={fetchReviews} />;
            case FetchStatus.Success:
                if (reviewList.length === 0) {
                    return null;
                }
                return reviewList.map(review => <ReviewCard key={review.id} review={review} />);
        }
    };
    
    return (
        <div>
            {canLeaveReview && user.businessId && (
                <ReviewForm businessId={businessId} authorBusinessId={parseInt(user.businessId)} onSubmitSuccess={fetchReviews} />
            )}

            {businessReviews.length > 0 && (
                 <div className="glass-card-style p-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('business_to_business_reviews')}</h3>
                    <div className="space-y-4">{renderReviewList(businessReviews)}</div>
                </div>
            )}
            
            <div className={`glass-card-style p-6 ${businessReviews.length > 0 ? 'mt-6' : ''}`}>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('customer_reviews')}</h3>
                <div className="space-y-4">
                    {renderReviewList(customerReviews)}
                     {status === FetchStatus.Success && reviews.length === 0 && (
                        <div className="col-span-full text-center text-[var(--text-secondary)] py-10">This business has no reviews yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReviewsPage: React.FC<{ businessId: number }> = ({ businessId }) => {
    const { t } = useTranslation();
    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-[var(--text-primary)]">{t('manage_reviews')}</h1>
                    <p className="text-[var(--text-secondary)] mt-2">{t('all_reviews_for_your_business')}</p>
                </header>
                <BusinessReviews businessId={businessId} />
            </div>
        </div>
    );
};

export default ReviewsPage;
