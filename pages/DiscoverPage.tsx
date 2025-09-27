
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import type { AdWithBusiness, Category } from '../src/types';
import { FetchStatus, Page } from '../src/types';
import { CITIES, CATEGORIES } from '../src/constants';
import { ChevronDownIcon, StarIcon, StarIconOutline, ShareIcon, WhatsAppIcon, PhoneIcon, InstagramIcon, PlayIcon, ChatBubbleOvalLeftEllipsisIcon, BookmarkIcon, BookmarkIconSolid } from '../components/icons/Icons';
import VideoCardSkeleton from '../components/skeletons/VideoCardSkeleton';
import { useStore } from '../src/store';
import CommentsPanel from '../components/CommentsPanel';
import { useDataFetcher } from '../hooks/useDataFetcher';


const AdFilters: React.FC<{
    selectedCity: string;
    setSelectedCity: (city: string) => void;
    selectedCategory: Category | '';
    setSelectedCategory: (category: Category | '') => void;
    selectedMediaType: 'all' | 'video';
    setSelectedMediaType: (type: 'all' | 'video') => void;
}> = ({ selectedCity, setSelectedCity, selectedCategory, setSelectedCategory, selectedMediaType, setSelectedMediaType }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
      <div ref={filterRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-2 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-full p-2 pr-3 text-[var(--text-primary)] font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          <span>{t('discover_filters_title')}</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="mt-2 bg-[var(--background-alt)] border border-[var(--border-color)] rounded-lg p-4 shadow-lg animate-fade-in-down">
            <div className="mb-4">
              <label htmlFor="city-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('city')}</label>
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label={t('city')}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">{t('all_cities')}</option>
                {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('all_categories')}</label>
              <div className="flex flex-wrap gap-2">
                 <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedCategory === '' ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'}`}
                  >
                    {t('all_categories')}
                  </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedCategory === cat ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'}`}
                  >
                    {t(cat)}
                  </button>
                ))}
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('media_type')}</label>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedMediaType('all')} className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedMediaType === 'all' ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'}`}>
                    {t('all')}
                    </button>
                    <button onClick={() => setSelectedMediaType('video')} className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedMediaType === 'video' ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'}`}>
                    {t('video_only')}
                    </button>
                </div>
            </div>
          </div>
        )}
         <style>{`
            @keyframes fade-in-down {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down {
              animation: fade-in-down 0.3s ease-out forwards;
            }
        `}</style>
      </div>
    );
};

const AdOverlay: React.FC<{ ad: AdWithBusiness, isPlaying: boolean }> = ({ ad, isPlaying }) => {
    const { t } = useTranslation();
    const { business } = ad;
    const navigate = useStore(state => state.navigate);

    return (
        <div className={`absolute inset-0 flex flex-col justify-between p-4 text-white bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
            {/* Top Info */}
            <div>
              {ad.isSponsored && <div className="inline-block bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold px-2 py-1 rounded-full mb-2">{t('sponsored')}</div>}
              <p className="text-gray-300 text-xs text-right opacity-70">{t('tap_to_hide')}</p>
            </div>

            {/* Bottom Info */}
            <div>
                <div 
                    className="flex items-center gap-3 mb-3 cursor-pointer"
                    onClick={() => navigate(Page.BusinessProfile, business.id)}
                >
                    <img src={business.logoUrl} alt={t(business.nameKey)} className="w-12 h-12 rounded-full border-2 border-white/50" />
                    <div>
                        <h2 className="font-bold text-lg">{t(business.nameKey)}</h2>
                        <p className="text-sm text-gray-300">{business.address.city}</p>
                    </div>
                </div>
                <h3 className="font-semibold mb-2">{ad.title}</h3>
                <div className="flex gap-2 mb-4">
                    {ad.tags.map(tag => (
                        <span key={tag} className="bg-white/10 text-xs px-2 py-1 rounded-md">{tag}</span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <a href={`https://wa.me/${business.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 text-sm"><WhatsAppIcon className="w-5 h-5"/> {t('whatsapp')}</a>
                    <a href={`tel:${business.phone}`} className="flex-1 bg-blue-500 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 text-sm"><PhoneIcon className="w-4 h-4" /> {t('call')}</a>
                    <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 text-sm"><InstagramIcon className="w-5 h-5" /> {t('instagram')}</a>
                </div>
            </div>
        </div>
    );
};

const AdActions: React.FC<{
    ad: AdWithBusiness;
    onCommentClick: () => void;
    onLike: () => void;
    onShare: () => void;
}> = ({ ad, onCommentClick, onLike, onShare }) => {
    const { t } = useTranslation();
    const { savedAdIds, toggleSaveAd } = useStore();
    const isSaved = savedAdIds.includes(ad.id);
    
    return (
        <div className="absolute right-2 bottom-28 z-20 flex flex-col gap-5">
            <button onClick={onLike} className="flex flex-col items-center text-white">
                {ad.isLikedByCurrentUser ? <StarIcon className="w-8 h-8"/> : <StarIconOutline className="w-8 h-8"/>}
                <span className="text-xs font-semibold">{ad.likeCount.toLocaleString()}</span>
            </button>
            <button onClick={onCommentClick} className="flex flex-col items-center text-white">
                <ChatBubbleOvalLeftEllipsisIcon className="w-8 h-8"/>
                <span className="text-xs font-semibold">{ad.commentCount.toLocaleString()}</span>
            </button>
             <button onClick={() => toggleSaveAd(ad.id)} className="flex flex-col items-center text-white">
                {isSaved ? <BookmarkIconSolid className="w-8 h-8 text-[var(--primary)]"/> : <BookmarkIcon className="w-8 h-8"/>}
                <span className="text-xs font-semibold">{t('saved')}</span>
            </button>
            <button onClick={onShare} className="flex flex-col items-center text-white">
                <ShareIcon className="w-8 h-8"/>
                <span className="text-xs font-semibold">{t('share')}</span>
            </button>
        </div>
    );
};

// FIX: Added return statement to VideoCard component and completed the useEffect logic.
const VideoCard: React.FC<{ 
    ad: AdWithBusiness; 
    onCommentClick: () => void;
    onUpdateAd: (updatedAd: AdWithBusiness) => void;
}> = ({ ad, onCommentClick, onUpdateAd }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleVideoClick = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleLike = async () => {
        (document.getElementById('star-sound') as HTMLAudioElement)?.play();
        const isLiking = !ad.isLikedByCurrentUser;
        const originalAd = { ...ad };

        // Optimistic update
        const optimisticallyUpdatedAd: AdWithBusiness = {
            ...ad,
            isLikedByCurrentUser: isLiking,
            likeCount: ad.likeCount + (isLiking ? 1 : -1),
        };
        onUpdateAd(optimisticallyUpdatedAd);

        try {
            const result = await api.toggleAdLike(ad.id, isLiking);
            // Confirm with server data
            const confirmedAd: AdWithBusiness = { ...optimisticallyUpdatedAd, likeCount: result.likeCount };
            onUpdateAd(confirmedAd);
        } catch (error) {
            // Revert on error
            onUpdateAd(originalAd);
            console.error("Failed to like ad:", error);
        }
    };
    
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: ad.title,
                    text: `${ad.title} from ${ad.business.nameKey}`,
                    url: window.location.href, // Or a direct link to the ad if available
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            alert('Share functionality is not supported on this browser.');
        }
    };

    useEffect(() => {
        const videoElement = videoRef.current;
        const targetElement = containerRef.current;
        if (!videoElement || !targetElement) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoElement.play().catch(error => {
                        console.error("Autoplay was prevented.", error);
                    });
                } else {
                    videoElement.pause();
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(targetElement);

        return () => {
            if (targetElement) {
                observer.unobserve(targetElement);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start rounded-xl overflow-hidden bg-black" onClick={handleVideoClick}>
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                loop
                playsInline
                poster={ad.coverImageUrl}
                src={ad.mediaUrls[0]}
                onPlay={handlePlay}
                onPause={handlePause}
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <PlayIcon className="w-20 h-20 text-white/70" />
                </div>
            )}
            <AdOverlay ad={ad} isPlaying={isPlaying} />
            <AdActions ad={ad} onCommentClick={onCommentClick} onLike={handleLike} onShare={handleShare} />
            <audio id="star-sound" src="/sounds/star.mp3" preload="auto"></audio>
        </div>
    );
};

// FIX: Added the main page component and exported it as default to resolve the import error.
const DiscoverPage: React.FC = () => {
    const { t } = useTranslation();
    const [adsData, setAdsData] = useState<AdWithBusiness[]>([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
    const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'video'>('all');
    const [commentsAdId, setCommentsAdId] = useState<number | null>(null);

    const fetcher = useCallback(() => {
        const filters = {
            city: selectedCity || undefined,
            category: selectedCategory || undefined,
            mediaType: selectedMediaType === 'video' ? ('video' as const) : undefined,
        };
        return api.fetchAds(filters);
    }, [selectedCity, selectedCategory, selectedMediaType]);

    const { data: ads, status } = useDataFetcher(fetcher);
    
    useEffect(() => {
        if (ads) {
            setAdsData(ads);
        }
    }, [ads]);

    const handleUpdateAd = (updatedAd: AdWithBusiness) => {
        setAdsData(prevAds => prevAds.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
    };
    
    const handleCommentPosted = () => {
        if (commentsAdId !== null) {
            const targetAd = adsData.find(ad => ad.id === commentsAdId);
            if (targetAd) {
                handleUpdateAd({ ...targetAd, commentCount: targetAd.commentCount + 1 });
            }
        }
    };

    return (
        <div className="flex-grow relative">
            <div className="absolute inset-0 h-full w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar">
                {status === FetchStatus.Loading || status === FetchStatus.Idle ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-full flex-shrink-0 snap-start"><VideoCardSkeleton /></div>)
                ) : status === FetchStatus.Success && adsData.length > 0 ? (
                    adsData.map(ad => (
                        <div key={ad.id} className="h-full flex-shrink-0 snap-start">
                            <VideoCard ad={ad} onCommentClick={() => setCommentsAdId(ad.id)} onUpdateAd={handleUpdateAd} />
                        </div>
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-center text-white">
                        <div>
                            <h2 className="text-2xl font-bold">No content found.</h2>
                            <p>Try adjusting your filters.</p>
                        </div>
                    </div>
                )}
            </div>

            <AdFilters
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedMediaType={selectedMediaType}
                setSelectedMediaType={setSelectedMediaType}
            />
            
            {commentsAdId !== null && (
                <CommentsPanel 
                    adId={commentsAdId} 
                    onClose={() => setCommentsAdId(null)}
                    onCommentPosted={handleCommentPosted}
                />
            )}
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default DiscoverPage;
