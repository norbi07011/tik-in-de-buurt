import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import type { Review } from '../src/types';
import { StarIcon } from './icons/Icons';
import { useStore } from '../src/store';

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} />
        ));
    };

    return (
        <div className="bg-[var(--background-alt)] p-4 rounded-lg border border-[var(--border-color-alt)] flex gap-4">
            <img src={review.avatarUrl} alt={review.author} className="w-12 h-12 rounded-full object-cover" />
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-[var(--text-primary)]">{review.author}</p>
                        <p className="text-xs text-[var(--text-muted)]">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex">{renderStars(review.rating)}</div>
                </div>
                <p className="text-[var(--text-secondary)] mt-2 text-sm">{review.text}</p>
            </div>
        </div>
    );
};

const ReviewForm: React.FC<{ freelancerId: number, onSubmitSuccess: () => void }> = ({ freelancerId, onSubmitSuccess }) => {
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
            await api.postFreelancerReview(freelancerId, rating, text);
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
                    placeholder="Share details of your own experience with this craftsman"
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

interface FreelancerReviewsProps {
    freelancerId: number;
    reviews: Review[];
    onReviewPosted: () => void;
}

const FreelancerReviews: React.FC<FreelancerReviewsProps> = ({ freelancerId, reviews, onReviewPosted }) => {
    const { t } = useTranslation();
    const { user } = useStore();
    
    return (
        <div>
            {user && (
                <ReviewForm freelancerId={freelancerId} onSubmitSuccess={onReviewPosted} />
            )}

            <div className="glass-card-style p-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('customer_reviews')}</h3>
                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map(review => <ReviewCard key={review.id} review={review} />)
                    ) : (
                        <div className="col-span-full text-center text-[var(--text-secondary)] py-10">This craftsman has no reviews yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FreelancerReviews;
