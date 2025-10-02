import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import { useStore } from '../src/store';
import type { AdWithBusiness, Business, PropertyListing } from '../src/types';
import { FetchStatus, Page } from '../src/types';
import AdCard from '../components/AdCard';
import AdCardSkeleton from '../components/skeletons/AdCardSkeleton';
import { BookmarkIcon, StarIcon, VerifiedIcon, BuildingStorefrontIcon, HomeModernIcon } from '../components/icons/Icons';
import BusinessCardSkeleton from '../components/skeletons/BusinessCardSkeleton';
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/skeletons/PropertyCardSkeleton';
import EmptyState from '../components/EmptyState';
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


const SavedAds: React.FC = () => {
    const { t } = useTranslation();
    const { savedAdIds, navigate } = useStore();
    
    const fetcher = useCallback(() => {
        if (savedAdIds.length === 0) return Promise.resolve([]);
        return api.fetchAdsByIds(savedAdIds);
    }, [savedAdIds]);

    const { data: ads, status, error, refetch } = useDataFetcher(fetcher);
    
    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: savedAdIds.length || 3 }).map((_, index) => (
                    <AdCardSkeleton key={index} />
                ));
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={refetch} />;
            case FetchStatus.Success:
                if (!ads || ads.length === 0) {
                     return (
                        <EmptyState
                            icon={<BookmarkIcon className="w-16 h-16" />}
                            title={t('no_saved_ads_yet')}
                            message={t('explore_to_save')}
                            actionButton={
                                <button
                                    onClick={() => navigate(Page.Discover)}
                                    className="mt-6 px-6 py-2 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300"
                                >
                                    {t('discover')}
                                </button>
                            }
                        />
                    );
                }
                 return ads.map((ad, index) => (
                     <ScrollAnimationWrapper key={ad.id} delay={index * 100}>
                        <AdCard ad={ad} />
                    </ScrollAnimationWrapper>
                ));
        }
    };
    
    return (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {renderContent()}
        </div>
    );
};

const SavedBusinesses: React.FC = () => {
    const { t } = useTranslation();
    const { savedBusinessIds, navigate } = useStore();
    
    const fetcher = useCallback(async () => {
        if (savedBusinessIds.length === 0) return [];
        // This is a simplified fetch; a real API might have a dedicated endpoint for this
        const allBusinesses = await api.fetchBusinesses({});
        return allBusinesses.filter(b => savedBusinessIds.includes(b.id));
    }, [savedBusinessIds]);
    
    const { data: businesses, status, error, refetch } = useDataFetcher(fetcher);
    
     const BusinessCard: React.FC<{ business: Business; }> = ({ business }) => (
        <div 
            className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 group hover:shadow-lg hover:shadow-[var(--primary)]/20"
            onClick={() => navigate(Page.BusinessProfile, business.id)}
        >
            <div className="h-32 bg-[var(--border-color-alt)] overflow-hidden relative">
                <img src={business.coverImageUrl} alt={`${t(business.nameKey)} cover`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <img src={business.logoUrl} alt={`${t(business.nameKey)} logo`} className="w-12 h-12 rounded-md border-2 border-[var(--border-color)]" />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-[var(--text-primary)] text-lg">{t(business.nameKey)}</h3>
                            {business.isVerified && <VerifiedIcon className="w-5 h-5 text-[var(--primary)]" />}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{t(business.categoryKey)}</p>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-3 text-sm text-[var(--text-muted)]">
                    <span>{business.address.city}</span>
                    <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-400"/>
                        <span className="text-[var(--text-primary)] font-semibold">{business.rating.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: savedBusinessIds.length || 3 }).map((_, index) => (
                    <BusinessCardSkeleton key={index} />
                ));
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={refetch} />;
            case FetchStatus.Success:
                if (!businesses || businesses.length === 0) {
                     return (
                        <EmptyState
                            icon={<BuildingStorefrontIcon className="w-16 h-16" />}
                            title={t('no_saved_businesses_yet')}
                            message={t('explore_businesses_to_save')}
                            actionButton={
                                 <button
                                    onClick={() => navigate(Page.Businesses)}
                                    className="mt-6 px-6 py-2 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300"
                                >
                                    {t('businesses')}
                                </button>
                            }
                        />
                    );
                }
                 return businesses.map((business, index) => (
                     <ScrollAnimationWrapper key={business.id} delay={index * 100}>
                        <BusinessCard business={business} />
                    </ScrollAnimationWrapper>
                ));
        }
    };
    
    return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderContent()}
        </div>
    );
}

const SavedProperties: React.FC = () => {
    const { t } = useTranslation();
    const { savedPropertyIds, navigate } = useStore();

    const fetcher = useCallback(() => {
        if (savedPropertyIds.length === 0) return Promise.resolve([]);
        return api.fetchPropertiesByIds(savedPropertyIds);
    }, [savedPropertyIds]);

    const { data: properties, status, error, refetch } = useDataFetcher(fetcher);
    
    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: savedPropertyIds.length || 3 }).map((_, index) => <PropertyCardSkeleton key={index} />);
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={refetch} />;
            case FetchStatus.Success:
                if (!properties || properties.length === 0) {
                    return (
                        <EmptyState
                            icon={<HomeModernIcon className="w-16 h-16" />}
                            title={t('no_saved_properties_yet')}
                            message={t('explore_properties_to_save')}
                            actionButton={
                                <button onClick={() => navigate(Page.RealEstate)} className="mt-6 px-6 py-2 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300">
                                    {t('real_estate')}
                                </button>
                            }
                        />
                    );
                }
                return properties.map((prop, index) => (
                    <ScrollAnimationWrapper key={prop.id} delay={index * 100}>
                        <PropertyCard listing={prop} />
                    </ScrollAnimationWrapper>
                ));
        }
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderContent()}
        </div>
    );
};


const SavedPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'ads' | 'businesses' | 'properties'>('ads');

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8 text-center">
                 <h1 className="text-4xl font-extrabold text-[var(--text-primary)]">{t('saved')}</h1>
            </header>
            
            <div className="mb-6 border-b border-[var(--border-color)]">
                <nav className="-mb-px flex space-x-6 justify-center">
                     <button
                        onClick={() => setActiveTab('ads')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'ads'
                            ? 'border-[var(--primary)] text-[var(--primary)]'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                        {t('my_saved_ads')}
                    </button>
                    <button
                        onClick={() => setActiveTab('businesses')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'businesses'
                            ? 'border-[var(--primary)] text-[var(--primary)]'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                        {t('my_saved_businesses')}
                    </button>
                     <button
                        onClick={() => setActiveTab('properties')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'properties'
                            ? 'border-[var(--primary)] text-[var(--primary)]'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                        {t('my_saved_properties')}
                    </button>
                </nav>
            </div>

            {activeTab === 'ads' && <SavedAds />}
            {activeTab === 'businesses' && <SavedBusinesses />}
            {activeTab === 'properties' && <SavedProperties />}
        </div>
    );
};

export default SavedPage;
