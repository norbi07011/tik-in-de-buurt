import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Page, FetchStatus } from '../src/types';
import type { Business, PostWithBusiness, Review, AdWithBusiness } from '../src/types';
import { ArrowLeftIcon, VerifiedIcon, StarIcon, FacebookIcon, InstagramIcon, TwitterIcon, LinkedinIcon, PhoneIcon, GlobeAltIcon, TikTokIcon, BanknotesIcon, MapPinIcon, UsersIcon, CreditCardIcon, LanguageIcon, TrophyIcon, GlobeEuropeAfricaIcon, CalendarDaysIcon, SparklesIcon, InformationCircleIcon } from '../components/icons/Icons';
import { api } from '../src/api';
import { useStore } from '../src/store';
import BusinessProfileSkeleton from '../components/skeletons/BusinessProfileSkeleton';
import BusinessReviews from '../components/BusinessReviews';
import BusinessMap from '../components/BusinessMap';
import BusinessGallery from '../components/BusinessGallery';
import BusinessAds from '../components/BusinessAds';
import PostCreator from '../components/PostCreator';
import PostCard from '../components/PostCard';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton';
import CommentsPanel from '../components/CommentsPanel';
import { useDataFetcher } from '../hooks/useDataFetcher';
import FuturisticSocials from '../components/FuturisticSocials';
import CVCard from '../components/CVCard';
import StreetViewButton from '../components/maps/StreetViewButton';
import { useBusinessLocation } from '../src/hooks/useBusinessLocation';

type Tab = 'wall' | 'information' | 'gallery' | 'our_ads' | 'reviews' | 'contact_location';

interface BusinessWallProps {
    business: Business;
    posts: PostWithBusiness[];
    isOwner: boolean;
    onPostCreated: () => void;
}

const BusinessWall: React.FC<BusinessWallProps> = ({ business, posts, isOwner, onPostCreated }) => {
    const { t } = useTranslation();
    const [currentPosts, setCurrentPosts] = useState(posts);
    const [commentsPostId, setCommentsPostId] = useState<number | null>(null);

    const handlePostUpdate = (updatedPost: PostWithBusiness) => {
        setCurrentPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    const handleCommentPosted = (postId: number) => {
        const targetPost = currentPosts.find(p => p.id === postId);
        if (targetPost) {
            handlePostUpdate({ ...targetPost, commentCount: targetPost.commentCount + 1 });
        }
    };

    return (
        <>
            <div className="max-w-2xl mx-auto space-y-6">
                {isOwner && <PostCreator businessId={business.id} onPostCreated={onPostCreated} />}
                {currentPosts.map(post => 
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        onUpdatePost={handlePostUpdate}
                        onCommentClick={() => setCommentsPostId(post.id)}
                    />
                )}
                {currentPosts.length === 0 && <div className="text-center text-[var(--text-secondary)] py-10">This business has not posted anything yet.</div>}
            </div>
            {commentsPostId !== null && (
                <CommentsPanel 
                    postId={commentsPostId} 
                    onClose={() => setCommentsPostId(null)} 
                    onCommentPosted={() => handleCommentPosted(commentsPostId)}
                />
            )}
        </>
    );
};


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

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="text-[var(--primary)] mt-1 flex-shrink-0">{icon}</div>
            <div>
                <p className="font-semibold text-[var(--text-secondary)] text-sm">{label}</p>
                <div className="text-[var(--text-primary)] font-medium">{value}</div>
            </div>
        </div>
    );
};

const InactiveProfileBanner: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);
    return (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 mb-6">
            <InformationCircleIcon className="w-10 h-10 flex-shrink-0" />
            <div className="flex-grow text-center sm:text-left">
                <h3 className="font-bold">{t('inactive_profile_banner_title')}</h3>
                <p className="text-sm opacity-80">{t('inactive_profile_banner_text')}</p>
            </div>
            <button 
                onClick={() => navigate(Page.Account)}
                className="bg-yellow-400 text-yellow-900 font-bold px-5 py-2 rounded-full text-sm hover:bg-yellow-300 transition-colors flex-shrink-0"
            >
                {t('activate_profile_yearly')}
            </button>
        </div>
    );
};


const BusinessProfilePage: React.FC<{ businessId: number }> = ({ businessId }) => {
    const { t } = useTranslation();
    const { navigate, user } = useStore();
    const [activeTab, setActiveTab] = useState<Tab>('wall');
    
    const fetcher = useCallback(() => api.fetchBusinessProfileData(businessId.toString()), [businessId]);
    const { data, status, error, refetch } = useDataFetcher(fetcher);

    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return <BusinessProfileSkeleton />;
    }

    if (status === FetchStatus.Error || !data) {
        return (
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                    <ErrorDisplay message={error?.message || 'Business not found'} onRetry={refetch} />
                </div>
            </div>
        );
    }

    const { business, reviews, ads, gallery, posts } = data;
    const isOwner = String(user?.businessId) === String(business.id);
    const isProfileActive = business.subscriptionStatus === 'active';

    const tabs: {id: Tab, label: string}[] = [
        { id: 'wall', label: t('wall') },
        { id: 'information', label: t('information') },
        { id: 'gallery', label: t('gallery') },
        { id: 'our_ads', label: t('our_ads') },
        { id: 'reviews', label: t('reviews') },
        { id: 'contact_location', label: t('contact_location') },
    ];
    
    const SocialLink: React.FC<{ href?: string; children: React.ReactNode }> = ({ href, children }) => {
        if (!href) return null;
        return (
             <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                {children}
            </a>
        );
    };
    
    const renderTabContent = () => {
        switch(activeTab) {
            case 'wall':
                return <BusinessWall business={business} posts={posts} isOwner={isOwner} onPostCreated={refetch} />;
            case 'information':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="glass-card-style p-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('about_us')}</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{t(business.descriptionKey)}</p>
                            </div>
                            <div className="glass-card-style p-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('company_details')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    <DetailItem icon={<CalendarDaysIcon className="w-5 h-5"/>} label={t('established_in')} value={business.establishedYear} />
                                    <DetailItem icon={<UsersIcon className="w-5 h-5"/>} label={t('team_size')} value={business.teamSize} />
                                    <DetailItem icon={<CreditCardIcon className="w-5 h-5"/>} label={t('payment_methods')} value={business.paymentMethods?.join(', ')} />
                                    <DetailItem icon={<LanguageIcon className="w-5 h-5"/>} label={t('spoken_languages')} value={business.spokenLanguages?.join(', ')} />
                                    {business.certifications && business.certifications.length > 0 && <DetailItem icon={<TrophyIcon className="w-5 h-5"/>} label={t('certifications_awards')} value={<ul>{business.certifications.map(c => <li key={c}>- {c}</li>)}</ul>} />}
                                    {business.sustainabilityInfo && <DetailItem icon={<GlobeEuropeAfricaIcon className="w-5 h-5"/>} label={t('sustainability')} value={business.sustainabilityInfo} />}
                                    {business.companyMotto && <DetailItem icon={<SparklesIcon className="w-5 h-5"/>} label={t('company_motto')} value={<p className="italic">"{business.companyMotto}"</p>} />}
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1 space-y-6">
                             <div className="glass-card-style p-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('our_services')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {business.services.map(service => (
                                        <span key={service.name} className="bg-[var(--border-color-alt)] text-[var(--text-secondary)] text-sm font-medium px-3 py-1 rounded-full">{service.name}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="glass-card-style p-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('opening_hours')}</h3>
                                <ul className="text-[var(--text-secondary)] space-y-1 text-sm">
                                    {Object.entries(business.openingHours).map(([day, hours]) => (
                                        <li key={day} className="flex justify-between">
                                            <span>{day}</span>
                                            <span className="font-semibold text-[var(--text-primary)]">{hours}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            case 'gallery':
                return <BusinessGallery images={gallery} />;
            case 'our_ads':
                return <BusinessAds ads={ads} />;
            case 'reviews':
                 return <BusinessReviews businessId={business.id} reviews={reviews} onReviewPosted={refetch} />;
            case 'contact_location':
                const { coordinates, isStreetViewAvailable } = useBusinessLocation(business.address);
                
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="md:col-span-2 space-y-6">
                            <div className="glass-card-style p-6">
                               <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('location_map')}</h3>
                               <BusinessMap address={business.address} />
                                <div className="mt-4 flex gap-2">
                                    {business.googleMapsUrl && (
                                        <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" 
                                            className="flex-1 text-center px-6 py-3 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300">
                                            {t('view_on_google_maps')}
                                        </a>
                                    )}
                                    {coordinates && isStreetViewAvailable && (
                                        <StreetViewButton 
                                            position={coordinates}
                                            businessName={t(business.nameKey)}
                                            address={`${business.address.street}, ${business.address.postalCode} ${business.address.city}`}
                                            variant="primary"
                                            size="md"
                                            className="flex-1"
                                        />
                                    )}
                                </div>
                           </div>
                           {business.otherLocations && business.otherLocations.length > 0 && (
                               <div className="glass-card-style p-6">
                                   <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('other_locations')}</h3>
                                   <div className="space-y-4">
                                       {business.otherLocations.map((loc, index) => (
                                           <div key={index} className="flex items-start gap-3 border-t glass-card-divider pt-3 first:border-t-0 first:pt-0">
                                                <MapPinIcon className="w-5 h-5 text-[var(--primary)] mt-1 flex-shrink-0" />
                                                <div>
                                                   <p className="font-semibold text-[var(--text-primary)]">{loc.street}</p>
                                                   <p className="text-sm text-[var(--text-secondary)]">{loc.postalCode} {loc.city}</p>
                                                </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                       </div>
                       <div className="md:col-span-1 space-y-6">
                            <div className="glass-card-style p-6">
                               <p className="font-semibold text-[var(--text-primary)]">{business.address.street}</p>
                               <p className="text-[var(--text-secondary)]">{business.address.postalCode} {business.address.city}</p>
                               <p className="text-[var(--text-secondary)]">{business.address.country}</p>
                               {coordinates && isStreetViewAvailable && (
                                   <div className="mt-4">
                                       <StreetViewButton 
                                           position={coordinates}
                                           businessName={t(business.nameKey)}
                                           address={`${business.address.street}, ${business.address.postalCode} ${business.address.city}`}
                                           variant="outline"
                                           size="sm"
                                           showLabel={true}
                                           className="w-full"
                                       />
                                   </div>
                               )}
                               <div className="border-t glass-card-divider pt-4 mt-4 space-y-2">
                                   <a href={`tel:${business.phone}`} className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--primary)]">
                                      <PhoneIcon className="w-5 h-5"/> <span>{business.phone}</span>
                                   </a>
                                   {business.website && <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--primary)]">
                                      <GlobeAltIcon className="w-5 h-5"/> <span>{t('website')}</span>
                                   </a>}
                               </div>
                               <div className="border-t glass-card-divider pt-4 mt-4">
                                   <h4 className="font-semibold text-[var(--text-primary)] mb-3">{t('follow_us')}</h4>
                                   <div className="flex items-center gap-4">
                                       <SocialLink href={`https://instagram.com/${business.instagram}`}><InstagramIcon className="w-6 h-6" /></SocialLink>
                                       <SocialLink href={business.facebook}><FacebookIcon className="w-6 h-6" /></SocialLink>
                                       <SocialLink href={business.tiktokUrl}><TikTokIcon className="w-6 h-6" /></SocialLink>
                                       <SocialLink href={business.twitter}><TwitterIcon className="w-6 h-6" /></SocialLink>
                                       <SocialLink href={business.linkedin}><LinkedinIcon className="w-6 h-6" /></SocialLink>
                                   </div>
                               </div>
                                <div className="mt-6 pt-6 border-t border-dashed glass-card-divider flex justify-center">
                                    <FuturisticSocials socials={{
                                        instagram: `https://instagram.com/${business.instagram}`,
                                        facebook: business.facebook,
                                        twitter: business.twitter,
                                        linkedin: business.linkedin,
                                        tiktok: business.tiktokUrl,
                                        website: business.website,
                                    }} />
                               </div>
                           </div>
                           <div className="glass-card-style p-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('legal_financial_info')}</h3>
                                <div className="space-y-3">
                                    <DetailItem icon={<BanknotesIcon className="w-5 h-5"/>} label={t('kvk_number')} value={business.kvkNumber} />
                                    <DetailItem icon={<BanknotesIcon className="w-5 h-5"/>} label={t('btw_number')} value={business.btwNumber} />
                                    <DetailItem icon={<BanknotesIcon className="w-5 h-5"/>} label={t('iban')} value={business.iban} />
                                </div>
                           </div>
                       </div>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(Page.Businesses)} className="mb-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-2">
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>{t('back_to_businesses')}</span>
                </button>
                
                {isOwner && !isProfileActive && <InactiveProfileBanner />}


                {/* Header Section */}
                <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-[-80px]">
                    <img src={business.coverImageUrl} alt={`${t(business.nameKey)} cover`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
                
                <div className="relative glass-card-style p-6">
                     <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <img src={business.logoUrl} alt={`${t(business.nameKey)} logo`} className="w-28 h-28 rounded-md border-4 border-black dark:border-[var(--background)] object-cover -mt-16" />
                            <div className="flex-grow text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">{t(business.nameKey)}</h1>
                                    {business.isVerified && <VerifiedIcon className="w-7 h-7 text-[var(--primary)]" />}
                                </div>
                                <p className="text-[var(--text-secondary)]">{business.address.city} • {t(business.categoryKey)}</p>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <StarIcon className="w-5 h-5"/>
                                        <span className="text-lg font-bold text-[var(--text-primary)]">{business.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-sm text-[var(--text-secondary)]">({business.adCount} {t('ads')})</span>
                                </div>
                            </div>
                        </div>
                         <div className="flex flex-col sm:flex-row items-center gap-6">
                            {business.cv && <CVCard entity={{...business, cv: business.cv }} />}
                            <FuturisticSocials socials={{
                                instagram: `https://instagram.com/${business.instagram}`,
                                facebook: business.facebook,
                                twitter: business.twitter,
                                linkedin: business.linkedin,
                                tiktok: business.tiktokUrl,
                                website: business.website,
                            }} />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
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

                {/* Tab Content */}
                <div className="mt-6">
                   {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default BusinessProfilePage;
