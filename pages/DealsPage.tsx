import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import { FetchStatus } from '../src/types';
import AdCard from '../components/AdCard';
import AdCardSkeleton from '../components/skeletons/AdCardSkeleton';
import { useDataFetcher } from '../hooks/useDataFetcher';

const ErrorDisplay: React.FC<{ message: string, onRetry: () => void }> = ({ message, onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="col-span-full flex flex-col items-center justify-center text-center h-full text-[var(--text-primary)] p-8 bg-[var(--card-bg)] rounded-lg">
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

const DealsPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: ads, status, error, refetch } = useDataFetcher(api.fetchDeals);

    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: 6 }).map((_, index) => (
                    <AdCardSkeleton key={index} />
                ));
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={refetch} />;
            case FetchStatus.Success:
                if (!ads || ads.length === 0) {
                    return <div className="col-span-full text-center text-[var(--text-secondary)] py-10">No special deals available right now.</div>;
                }
                return ads.map((ad, index) => (
                     <ScrollAnimationWrapper key={ad.id} delay={index * 100}>
                        <AdCard ad={ad} />
                    </ScrollAnimationWrapper>
                ));
        }
    };

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8 text-center">
                 <h1 className="text-4xl font-extrabold text-[var(--text-primary)]">{t('deals_hero_title')}</h1>
                 <p className="text-[var(--text-secondary)] mt-2 max-w-2xl mx-auto">{t('deals_hero_subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default DealsPage;
