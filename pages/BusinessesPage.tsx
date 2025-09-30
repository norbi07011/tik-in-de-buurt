import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, CITIES } from '../src/constants';
import { Page, FetchStatus } from '../src/types';
import type { Business, Category } from '../src/types';
import { ChevronDownIcon, GlobeAltIcon, InstagramIcon, FacebookIcon, TwitterIcon } from '../components/icons/Icons';
import { api } from '../src/api';
import { useStore } from '../src/store';
import { useDataFetcher } from '../hooks/useDataFetcher';
import StreetViewButton from '../components/maps/StreetViewButton';
import { useBusinessLocation } from '../src/hooks/useBusinessLocation';

const UiverseBusinessCard: React.FC<{ business: Business }> = ({ business }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);
    const { coordinates, isStreetViewAvailable } = useBusinessLocation(business.address, t(business.nameKey));

    const socials = [];
    if (business.website) socials.push({ type: 'website' as const, url: business.website });
    if (business.instagram) socials.push({ type: 'instagram' as const, url: `https://instagram.com/${business.instagram}` });
    if (business.facebook) socials.push({ type: 'facebook' as const, url: business.facebook });
    if (business.twitter) socials.push({ type: 'twitter' as const, url: business.twitter });

    const handleViewMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(Page.BusinessProfile, business.id);
    };

    return (
        <div className="parent">
          <div className="card" onClick={() => navigate(Page.BusinessProfile, business.id)}>
            <div className="logo">
              <span className="circle circle1"></span>
              <span className="circle circle2"></span>
              <span className="circle circle3"></span>
              <span className="circle circle4"></span>
              <span className="circle circle5">
                UI
              </span>
            </div>
            <div className="glass"></div>
            <div className="content">
              <h3 className="title">{t(business.nameKey)}</h3>
              <p className="text">{t(business.descriptionKey)}</p>
            </div>
            <div className="bottom">
              <div className="social-buttons-container">
                {socials.slice(0, 2).map((social) => (
                  <a
                    key={social.type}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-button"
                    aria-label={social.type}
                    onClick={(e) => e.stopPropagation()}
                  >
                     {social.type === 'website' && <GlobeAltIcon className="svg" />}
                     {social.type === 'instagram' && <InstagramIcon className="svg" />}
                     {social.type === 'facebook' && <FacebookIcon className="svg" />}
                     {social.type === 'twitter' && <TwitterIcon className="svg" />}
                  </a>
                ))}
                
                {/* Street View Button */}
                {isStreetViewAvailable && coordinates && (
                  <div className="social-button" onClick={(e) => e.stopPropagation()}>
                    <StreetViewButton
                      position={coordinates}
                      businessName={t(business.nameKey)}
                      address={`${business.address.street}, ${business.address.city}`}
                      size="sm"
                      variant="outline"
                      showLabel={false}
                      className="!p-2 !border-none hover:!bg-transparent"
                    />
                  </div>
                )}
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


const FilterDropdown: React.FC<{ 
    options: string[], 
    value: string,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    defaultLabel: string 
}> = ({ options, value, onChange, defaultLabel }) => {
    const { t } = useTranslation();
    return (
        <div className="relative">
            <select 
                value={value}
                onChange={onChange}
                aria-label={defaultLabel}
                className="appearance-none w-full bg-[var(--background-alt)] border border-[var(--border-color)] rounded-md py-2 px-4 pr-8 text-[var(--text-primary)] leading-tight focus:outline-none focus:bg-[var(--border-color-alt)] focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/50"
            >
                <option value="">{defaultLabel}</option>
                {options.map(option => <option key={option} value={option}>{t(option) || option}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-secondary)]">
                <ChevronDownIcon className="w-4 h-4"/>
            </div>
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

const BusinessesPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
    const [selectedCity, setSelectedCity] = useState('');

    const fetcher = useCallback(() => {
        const filters = {
            search: searchTerm,
            category: selectedCategory,
            city: selectedCity,
        };
        return api.getBusinesses(filters);
    }, [searchTerm, selectedCategory, selectedCity]);
    
    const { data: businesses, status, error, refetch } = useDataFetcher(fetcher);
    
    const renderContent = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="parent"><div className="card bg-[var(--border-color-alt)] animate-pulse"></div></div>
                ));
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={refetch} />;
            case FetchStatus.Success:
                 if (!businesses || businesses.length === 0) {
                    return <div className="text-center text-[var(--text-secondary)] py-10 col-span-full">No businesses found matching your criteria.</div>
                }
                return businesses.map((business) => (
                    <UiverseBusinessCard key={business.id} business={business} />
                ));
        }
    };

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)] text-center">Ontdek bedrijven</h1>
                <p className="text-[var(--text-secondary)] text-center mt-2">Vind lokale bedrijven in jouw stad</p>
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
                          placeholder={t('search_businesses_categories')}
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
                <div className="w-full md:w-48">
                    <FilterDropdown 
                        options={CATEGORIES} 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as Category)}
                        defaultLabel={t('all_categories')} />
                </div>
                <div className="w-full md:w-48">
                     <FilterDropdown 
                        options={CITIES} 
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        defaultLabel={t('city')} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default BusinessesPage;
