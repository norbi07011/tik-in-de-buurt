import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import { FetchStatus, PropertyListing, PropertyStatus, PropertyType, Page } from '../src/types';
import { MapIcon, ListBulletIcon, BedIcon, ArrowsPointingOutIcon, ShowerIcon } from '../components/icons/Icons';
import PropertyCardSkeleton from '../components/skeletons/PropertyCardSkeleton';
import BusinessMap from '../components/BusinessMap';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { useStore } from '../src/store';

const UiversePropertyCard: React.FC<{ listing: PropertyListing }> = ({ listing }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
    };

    const handleViewMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(Page.PropertyListing, listing.id);
    };

    return (
        <article className="parent u-card" onClick={() => navigate(Page.PropertyListing, listing.id)}>
          <div className="card">
            {/* eslint-disable-next-line no-inline-styles */}
            <div 
                className="glass u-media property-media-bg" 
                style={{backgroundImage: `url(${listing.photos[0]})`}}
            >
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="logo">
                  <span className="circle circle1"></span>
                  <span className="circle circle2"></span>
                  <span className="circle circle3"></span>
                  <span className="circle circle4"></span>
                  <span className="circle circle5 !text-xs !px-1 !leading-tight !flex !items-center !justify-center">
                    {formatPrice(listing.price)}
                  </span>
                </div>
            </div>
            <div className="content u-body">
              <h3 className="title line-clamp-2">{listing.title}</h3>
              <p className="text !h-auto line-clamp-2">{listing.address.street}, {listing.address.city}</p>
              <div className="bottom mt-auto">
                <div className="social-buttons-container">
                  <div className="flex items-center gap-1.5 text-xs text-white" data-abs="off">
                      <BedIcon className="w-4 h-4 text-white"/>{listing.bedrooms}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white" data-abs="off">
                      <ShowerIcon className="w-4 h-4 text-white"/>{listing.bathrooms}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white" data-abs="off">
                      <ArrowsPointingOutIcon className="w-4 h-4 text-white"/>{listing.livingArea} m²
                  </div>
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
        </article>
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
        <div ref={ref} className={`scroll-animate ${isVisible ? 'is-visible' : ''} scroll-animate-delay-${delay}`}>
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

const RealEstatePage: React.FC = () => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: null as PropertyStatus | null,
        type: null as PropertyType | null,
        priceMin: '',
        priceMax: '',
        bedrooms: '',
    });

    const fetcher = useCallback(() => api.fetchPropertyListings({ 
        search: searchTerm, 
        status: filters.status,
        type: filters.type,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        bedrooms: filters.bedrooms,
    }), [searchTerm, filters]);

    const { data: listings, status, error, refetch } = useDataFetcher(fetcher);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };
    
    const renderListView = () => {
        switch (status) {
            case FetchStatus.Loading:
            case FetchStatus.Idle:
                return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 [grid-auto-rows:1fr]">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="parent u-card"><div className="card bg-[var(--border-color-alt)] animate-pulse"></div></div>)}</div>;
            case FetchStatus.Error:
                return <ErrorDisplay message={error?.message || 'Unknown error'} onRetry={refetch} />;
            case FetchStatus.Success:
                if (!listings || listings.length === 0) {
                    return <div className="col-span-full text-center text-[var(--text-secondary)] py-10">{t('no_properties_found')}</div>;
                }
                return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 [grid-auto-rows:1fr]">{listings.map((listing, index) => (
                    <UiversePropertyCard key={listing.id} listing={listing} />
                ))}</div>;
        }
    };
    
    const renderMapView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-22rem)]">
            <div className="lg:col-span-2 overflow-y-auto space-y-4 pr-2">
                 {status === FetchStatus.Success && listings && listings.map(listing => (
                    <div key={listing.id} onMouseEnter={() => setHoveredPropertyId(listing.id)} onMouseLeave={() => setHoveredPropertyId(null)}>
                        <UiversePropertyCard listing={listing} />
                    </div>
                ))}
                {(status === FetchStatus.Loading || status === FetchStatus.Idle) && Array.from({ length: 3 }).map((_, i) => <div key={i} className="parent u-card"><div className="card bg-[var(--border-color-alt)] animate-pulse"></div></div>)}
            </div>
            <div className="lg:col-span-3 h-full rounded-lg overflow-hidden">
                {listings && listings.length > 0 && <BusinessMap address={listings[0].address} />}
            </div>
        </div>
    );
    
    return (
        <div className="safe-main mx-auto max-w-7xl px-4 py-6">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)]">{t('find_your_next_home')}</h1>
            </header>

             <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-lg p-4 mb-8 space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
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
                              placeholder={t('search_address_city')}
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
                    <div className="flex items-center gap-2 bg-[var(--background-alt)] border border-[var(--border-color)] rounded-md p-1">
                        <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-[var(--primary)] text-[var(--primary-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--border-color-alt)]'}`}><ListBulletIcon className="w-5 h-5"/>{t('list_view')}</button>
                        <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 ${viewMode === 'map' ? 'bg-[var(--primary)] text-[var(--primary-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--border-color-alt)]'}`}><MapIcon className="w-5 h-5"/>{t('map_view')}</button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                                        <select 
                        name="status" 
                        value={filters.status || ''} 
                        onChange={handleInputChange} 
                        aria-label="Property status filter"
                        className="input-filter"
                    >
                        <option value="">{t('property_status')}</option>
                        <option value={PropertyStatus.ForSale}>{t('for_sale')}</option>
                        <option value={PropertyStatus.ForRent}>{t('for_rent')}</option>
                    </select>
                    <select 
                        name="type" 
                        value={filters.type || ''} 
                        onChange={handleInputChange} 
                        aria-label="Property type filter"
                        className="input-filter"
                    >
                        <option value="">{t('property_type')}</option>
                        <option value={PropertyType.House}>{t('house')}</option>
                        <option value={PropertyType.Apartment}>{t('apartment')}</option>
                    </select>
                                        <select 
                        name="bedrooms" 
                        value={filters.bedrooms} 
                        onChange={handleInputChange} 
                        aria-label="Number of bedrooms filter"
                        className="input-filter"
                    >
                        <option value="">{t('bedrooms')}</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <input name="priceMin" type="number" placeholder="Min Price" value={filters.priceMin} onChange={handleInputChange} className="input-filter" />
                        <span>-</span>
                        <input name="priceMax" type="number" placeholder="Max Price" value={filters.priceMax} onChange={handleInputChange} className="input-filter" />
                    </div>
                </div>
            </div>

            {viewMode === 'list' ? renderListView() : renderMapView()}
            
             <style>{`
                .input-filter { appearance: none; background-color: var(--background-alt); border: 1px solid var(--border-color); border-radius: 9999px; padding: 0.5rem 1rem; color: var(--text-primary); font-size: 0.875rem; }
            `}</style>
        </div>
    )
}

export default RealEstatePage;
