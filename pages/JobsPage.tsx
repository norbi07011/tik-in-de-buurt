import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { JOB_CATEGORIES, CITIES } from '../src/constants';
import { FetchStatus, Freelancer, Page } from '../src/types';
import { api } from '../src/api';
import FreelancerCardSkeleton from '../components/skeletons/FreelancerCardSkeleton';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { useStore } from '../src/store';
import { GlobeAltIcon, InstagramIcon, FacebookIcon, TwitterIcon, StarIcon } from '../components/icons/Icons';

const UiverseFreelancerCard: React.FC<{ freelancer: Freelancer }> = ({ freelancer }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);

    const handleViewMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(Page.FreelancerProfile, freelancer.id);
    };

    return (
        <div className="parent">
          <div className="card" onClick={() => navigate(Page.FreelancerProfile, freelancer.id)}>
            <div className="logo">
              <span className="circle circle1"></span>
              <span className="circle circle2"></span>
              <span className="circle circle3"></span>
              <span className="circle circle4"></span>
              <span className="circle circle5 !text-lg !flex !items-center !justify-center">
                <StarIcon className="w-4 h-4 text-black inline-block mr-1" /> {freelancer.rating.toFixed(1)}
              </span>
            </div>
            <div className="glass"></div>
            <div className="content">
              <h3 className="title">{t(freelancer.nameKey)}</h3>
              <p className="text !h-auto">{t(freelancer.specializationKey)}</p>
            </div>
            <div className="bottom">
                <div className="social-buttons-container">
                    {/* Placeholder for potential future social links */}
                </div>
                <div className="view-more">
                    <button className="view-more-button" onClick={handleViewMore}>
                    {t('view_profile')}
                    </button>
                    <svg className="svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </div>
            </div>
          </div>
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
        <div ref={ref} className={`scroll-animate ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
};

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

const JobsPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');

    const fetcher = useCallback(() => {
        const filters = {
            search: searchTerm,
            category: selectedCategory,
            city: selectedCity,
        };
        return api.fetchFreelancers(filters);
    }, [searchTerm, selectedCategory, selectedCity]);

    const { data: freelancers, status, error, refetch } = useDataFetcher(fetcher);
    
    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: 6 }).map((_, index) => <div key={index} className="parent"><div className="card bg-[var(--border-color-alt)] animate-pulse"></div></div>);
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={refetch} />;
            case FetchStatus.Success:
                 if (!freelancers || freelancers.length === 0) {
                    return <div className="col-span-full text-center text-[var(--text-secondary)] py-10">{t('no_craftsmen_found')}</div>
                }
                return freelancers.map((freelancer, index) => (
                    <UiverseFreelancerCard key={freelancer.id} freelancer={freelancer} />
                ));
        }
    };

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)] text-center">{t('find_craftsman_nearby')}</h1>
            </header>
            
            <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
                 <div className="flex-grow w-full">
                    <div className="search-container">
                      <div className="search-grid-bg"></div>
                      <div className="search-box">
                        <span className="search-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        </span>
                        <input
                          type="text"
                          className="search-input"
                          placeholder={t('search_craftsman_specialization')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="filter-icon">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
                            <path d="M5.83333 8.33333H14.1667M3.33333 5H16.6667M8.33333 11.6667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        </span>
                      </div>
                    </div>
                </div>
                 <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full md:w-48 bg-[var(--background-alt)] border border-[var(--border-color)] rounded-md py-2 px-4 text-[var(--text-primary)]">
                    <option value="">{t('all_cities')}</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            
             <div className="mb-8 flex flex-wrap gap-2 justify-center">
                 <button onClick={() => setSelectedCategory('')} className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all duration-300 ${selectedCategory === '' ? 'bg-[var(--primary)] text-[var(--primary-text)] border-transparent' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}>
                    {t('all_categories')}
                </button>
                {JOB_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all duration-300 ${selectedCategory === cat.id ? 'bg-[var(--primary)] text-[var(--primary-text)] border-transparent' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}>
                        {t(cat.translationKey)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default JobsPage;
