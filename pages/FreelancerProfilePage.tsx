import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Page, FetchStatus, Freelancer, Review } from '../src/types';
import { ArrowLeftIcon, StarIcon } from '../components/icons/Icons';
import { api } from '../src/api';
import { useStore } from '../src/store';
import BusinessProfileSkeleton from '../components/skeletons/BusinessProfileSkeleton'; // Reusing for skeleton
import FuturisticSocials from '../components/FuturisticSocials';
import { useDataFetcher } from '../hooks/useDataFetcher';
import FreelancerReviews from '../components/FreelancerReviews';
import CVCard from '../components/CVCard';

const ErrorDisplay: React.FC<{ message: string, onRetry: () => void }> = ({ message, onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center text-center h-full text-[var(--text-primary)] p-8 bg-[var(--card-bg)] rounded-lg">
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

const FreelancerProfilePage: React.FC<{ freelancerId: number }> = ({ freelancerId }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);
    const [activeTab, setActiveTab] = useState<'portfolio' | 'about_services' | 'reviews'>('about_services');

    const fetcher = useCallback(() => api.fetchFreelancerProfileData(freelancerId), [freelancerId]);
    const { data, status, error, refetch } = useDataFetcher(fetcher);
    
    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return <BusinessProfileSkeleton />;
    }

    if (status === FetchStatus.Error || !data) {
        return (
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                    <ErrorDisplay message={error?.message || 'Freelancer not found'} onRetry={refetch} />
                </div>
            </div>
        );
    }
    
    const { freelancer, reviews } = data;

    const tabs: {id: typeof activeTab, label: string}[] = [
        { id: 'about_services', label: t('about_services') },
        { id: 'portfolio', label: t('portfolio') },
        { id: 'reviews', label: t('reviews') },
    ];
    
    const renderTabContent = () => {
        switch(activeTab) {
            case 'portfolio':
                if (freelancer.portfolioImages.length === 0) {
                    return <div className="glass-card-style text-center text-[var(--text-secondary)] py-10">{t('gallery_no_images_found')}</div>;
                }
                return (
                     <div className="glass-card-style p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {freelancer.portfolioImages.map((img, index) => (
                                <div key={index} className="aspect-square bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer group">
                                    <img src={img} alt={`Portfolio image ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'about_services':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 glass-card-style p-6">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('about_us')}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{t(freelancer.aboutKey)}</p>
                        </div>
                        <div className="md:col-span-1 glass-card-style p-6">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('our_services')}</h3>
                            <ul className="space-y-2">
                                {freelancer.services.map(service => (
                                    <li key={service.nameKey} className="flex justify-between items-center text-sm border-b glass-card-divider pb-2 last:border-0 last:pb-0">
                                        <span className="text-[var(--text-secondary)]">{t(service.nameKey)}</span>
                                        <span className="font-semibold text-[var(--text-primary)]">{service.price}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            case 'reviews':
                 return <FreelancerReviews freelancerId={freelancer.id} reviews={reviews} onReviewPosted={refetch} />;
            default:
                return null;
        }
    }

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(Page.Jobs)} className="mb-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-2">
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>{t('back_to_craftsmen')}</span>
                </button>
                
                 {/* Header Section */}
                <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-[-80px]">
                    <img src={freelancer.portfolioImages[0] || 'https://picsum.photos/1200/400'} alt={`${t(freelancer.nameKey)} cover`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>

                <div className="relative glass-card-style p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <img src={freelancer.profileImageUrl} alt={t(freelancer.nameKey)} className="w-28 h-28 rounded-md border-4 border-black dark:border-[var(--background)] object-cover -mt-16" />
                            <div className="flex-grow text-center md:text-left">
                                <h1 className="text-3xl font-bold text-[var(--text-primary)]">{t(freelancer.nameKey)}</h1>
                                <p className="text-[var(--primary)] font-semibold">{t(freelancer.specializationKey)}</p>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <StarIcon className="w-5 h-5"/>
                                        <span className="text-lg font-bold text-[var(--text-primary)]">{freelancer.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-sm text-[var(--text-secondary)]">({freelancer.reviewCount} {t('reviews')})</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* FIX: Corrected prop name from 'freelancer' to 'entity' to match CVCardProps. */}
                            <CVCard entity={freelancer} />
                            <FuturisticSocials socials={{
                                instagram: freelancer.instagram,
                                twitter: freelancer.twitter,
                                website: freelancer.website,
                                facebook: freelancer.facebook,
                                linkedin: freelancer.linkedin,
                                tiktok: freelancer.tiktokUrl,
                            }} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-b border-[var(--border-color)]">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === tab.id
                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-6">
                   {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default FreelancerProfilePage;
