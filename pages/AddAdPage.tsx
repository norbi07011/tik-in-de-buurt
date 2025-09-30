

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CITIES, CATEGORIES } from '../src/constants';
import { CheckCircleIcon, ImageIcon, VideoCameraIcon, PhotoIcon, ViewColumnsIcon, SparklesIcon, DevicePhoneMobileIcon, Squares2X2Icon, CalendarDaysIcon, BuildingOffice2Icon, MegaphoneIcon, CameraIcon } from '../components/icons/Icons';
import { api } from '../src/api';
import { useStore } from '../src/store';
import { Page, Ad, Business, FetchStatus, PropertyStatus, PropertyType, AdWithBusiness, PropertyListing } from '../src/types';
import AdCard from '../components/AdCard';
import AdCardSkeleton from '../components/skeletons/AdCardSkeleton';
import MediaUploader from '../components/MediaUploader';
import { GoogleGenAI } from "@google/genai";
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/skeletons/PropertyCardSkeleton';

const StepIndicator: React.FC<{ currentStep: number; steps: string[] }> = ({ currentStep, steps }) => {
    return (
        <div className="flex items-center justify-center space-x-2 md:space-x-4">
            {steps.map((title, index) => {
                const step = index + 1;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center text-center w-24">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${currentStep >= step ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-text)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                                {currentStep > step ? <CheckCircleIcon className="w-6 h-6" /> : step}
                            </div>
                            <p className={`mt-2 text-xs font-semibold transition-colors duration-300 ${currentStep >= step ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{title}</p>
                        </div>
                        {index < steps.length - 1 && <div className={`h-0.5 flex-grow ${currentStep > step ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>}
                    </React.Fragment>
                )
            })}
        </div>
    );
};

const AddAdPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);
    const user = useStore(state => state.user);
    
    const [userBusiness, setUserBusiness] = useState<Business | null>(null);
    const [businessStatus, setBusinessStatus] = useState(FetchStatus.Idle);
    
    const [adType, setAdType] = useState<'image' | 'video' | 'property' | null>(null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState('');
    
    const [propertyData, setPropertyData] = useState({
        title: '',
        status: PropertyStatus.ForSale,
        type: PropertyType.House,
        price: '',
        livingArea: '',
        plotSize: '',
        bedrooms: '',
        bathrooms: '',
        yearBuilt: '',
        energyLabel: 'A',
        description: '',
        photos: [] as string[],
        street: '',
        postalCode: '',
        city: CITIES[0],
    });

    const [adData, setAdData] = useState<Partial<Ad>>({
        mediaType: undefined,
        title: '',
        category: '',
        city: CITIES[0],
        mediaUrls: [],
        coverImageUrl: '',
        layoutTemplate: 'single',
        structuredDescription: { benefit: '', features: '', solution: '' },
        discountPercentage: undefined,
        tags: [],
        startDate: '',
        endDate: '',
        callToAction: { text: '', link: '' }
    });
    
     useEffect(() => {
        const fetchBusiness = async () => {
            if (user) {
                setBusinessStatus(FetchStatus.Loading);
                try {
                    const business = await api.fetchBusinessByOwnerId(user.id);
                    setUserBusiness(business);
                    setBusinessStatus(FetchStatus.Success);
                } catch (e) {
                    setBusinessStatus(FetchStatus.Error);
                }
            }
        };
        fetchBusiness();
    }, [user]);

    const handlePropertyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPropertyData(prev => ({...prev, [name]: value}));
    }

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setError(null);
        if (!userBusiness) {
            setError("Could not find business data for the user.");
            setIsLoading(false);
            return;
        }
        try {
            const dataToSubmit = {
                adType: adType,
                businessId: userBusiness.id,
                ...(adType === 'property' ? { ...propertyData, price: Number(propertyData.price) } : adData)
            };
            await api.createAd(dataToSubmit);
            navigate(adType === 'property' ? Page.RealEstate : Page.Discover);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            setAdData(p => ({ ...p, tags: [...(p.tags || []), tagInput.trim()] }));
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setAdData(p => ({ ...p, tags: (p.tags || []).filter(tag => tag !== tagToRemove) }));
    };

    const steps = adType === 'property' 
        ? [t('what_type_of_ad'), t('property_details'), t('content_and_media'), t('preview_and_publish')]
        : [t('what_type_of_ad'), t('basic_details'), t('content_and_media'), t('offer_and_description'), t('preview_and_publish')];

    const renderStepContent = () => {
        switch (step) {
            case 1: return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onClick={() => { setAdType('image'); setAdData(p=>({...p, mediaType: 'image'})); nextStep(); }} className="ad-type-card group">
                        <ImageIcon className="w-12 h-12 mx-auto text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors duration-300" />
                        <h3 className="text-xl font-bold mt-4 text-[var(--text-primary)]">{t('image')}</h3>
                        <p className="text-[var(--text-secondary)] mt-1">{t('image_description')}</p>
                    </button>
                    <button onClick={() => { setAdType('video'); setAdData(p=>({...p, mediaType: 'video'})); nextStep(); }} className="ad-type-card group">
                        <VideoCameraIcon className="w-12 h-12 mx-auto text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors duration-300" />
                        <h3 className="text-xl font-bold mt-4 text-[var(--text-primary)]">{t('video')}</h3>
                        <p className="text-[var(--text-secondary)] mt-1">{t('video_description')}</p>
                    </button>
                    <button onClick={() => { setAdType('property'); nextStep(); }} className="ad-type-card group">
                        <BuildingOffice2Icon className="w-12 h-12 mx-auto text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors duration-300" />
                        <h3 className="text-xl font-bold mt-4 text-[var(--text-primary)]">{t('property')}</h3>
                        <p className="text-[var(--text-secondary)] mt-1">{t('property_description')}</p>
                    </button>
                </div>
            );
            case 2:
                if (adType === 'property') {
                    return (
                         <div className="space-y-4">
                            <h3 className="text-xl font-bold text-center mb-4">{t('property_details')}</h3>
                            <div><label className="input-label">{t('title')}</label><input name="title" value={propertyData.title} onChange={handlePropertyChange} required className="input-field" placeholder={t('property_title_placeholder')} aria-label={t('title')} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="input-label">{t('property_status')}</label><select name="status" value={propertyData.status} onChange={handlePropertyChange} className="input-field" aria-label={t('property_status')}><option value={PropertyStatus.ForSale}>{t('for_sale')}</option><option value={PropertyStatus.ForRent}>{t('for_rent')}</option></select></div>
                                <div><label className="input-label">{t('property_type')}</label><select name="type" value={propertyData.type} onChange={handlePropertyChange} className="input-field" aria-label={t('property_type')}><option value={PropertyType.House}>{t('house')}</option><option value={PropertyType.Apartment}>{t('apartment')}</option></select></div>
                            </div>
                            <div><label className="input-label">{t('price')}</label><input name="price" type="number" value={propertyData.price} onChange={handlePropertyChange} className="input-field" placeholder="0" aria-label={t('price')} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="input-label">{t('street_address')}</label><input name="street" value={propertyData.street} onChange={handlePropertyChange} className="input-field" placeholder={t('street_placeholder') || 'Street address'} aria-label={t('street_address')} /></div>
                                <div><label className="input-label">{t('city')}</label><select name="city" value={propertyData.city} onChange={handlePropertyChange} className="input-field" aria-label={t('city')}>{CITIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                                <div><label className="input-label">{t('postal_code')}</label><input name="postalCode" value={propertyData.postalCode} onChange={handlePropertyChange} className="input-field" placeholder="1234 AB" aria-label={t('postal_code')} /></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><label className="input-label">{t('bedrooms')}</label><input name="bedrooms" type="number" value={propertyData.bedrooms} onChange={handlePropertyChange} className="input-field" placeholder="1" aria-label={t('bedrooms')} /></div>
                                <div><label className="input-label">{t('bathrooms')}</label><input name="bathrooms" type="number" value={propertyData.bathrooms} onChange={handlePropertyChange} className="input-field" placeholder="1" aria-label={t('bathrooms')} /></div>
                                <div><label className="input-label">{t('living_area')}</label><input name="livingArea" type="number" value={propertyData.livingArea} onChange={handlePropertyChange} className="input-field" placeholder="50" aria-label={t('living_area')} /></div>
                                <div><label className="input-label">{t('year_built')}</label><input name="yearBuilt" type="number" value={propertyData.yearBuilt} onChange={handlePropertyChange} className="input-field" placeholder="2020" aria-label={t('year_built')} /></div>
                            </div>
                            <div className="flex justify-between mt-6"><button type="button" onClick={() => { setStep(1); setAdType(null); }} className="btn-secondary">{t('back')}</button><button type="button" onClick={nextStep} className="btn-primary">{t('continue')}</button></div>
                        </div>
                    );
                }
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-center mb-4">{t('basic_details')}</h3>
                        <div>
                            <label className="input-label">{t('title')}</label>
                            <input name="title" value={adData.title || ''} onChange={e => setAdData(p => ({ ...p, title: e.target.value }))} required className="input-field" placeholder={t('give_your_ad_title')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">{t('business_category')}</label>
                                <select name="category" value={adData.category} onChange={e => setAdData(p => ({ ...p, category: e.target.value }))} className="input-field" aria-label={t('business_category')}>
                                    <option value="">{t('all_categories')}</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">{t('city')}</label>
                                <select name="city" value={adData.city} onChange={e => setAdData(p => ({ ...p, city: e.target.value }))} className="input-field" aria-label={t('city')}>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="input-label">{t('tags')}</label>
                            <div className="flex flex-wrap gap-2 p-2 border border-[var(--border-color)] rounded-md">
                                {adData.tags?.map(tag => (
                                    <span key={tag} className="bg-[var(--primary)] text-[var(--primary-text)] text-sm px-2 py-1 rounded-full flex items-center gap-1">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="font-bold">x</button>
                                    </span>
                                ))}
                                <input
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    className="bg-transparent focus:outline-none flex-grow"
                                    placeholder={t('add_tags_instruction')}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between mt-6">
                            <button type="button" onClick={() => { setStep(1); setAdType(null); }} className="btn-secondary">{t('back')}</button>
                            <button type="button" onClick={nextStep} className="btn-primary">{t('continue')}</button>
                        </div>
                    </div>
                );
            case 3:
                 if (adType === 'property') {
                    return (
                        <div>
                             <h3 className="text-xl font-bold text-center mb-4">{t('upload_property_photos')}</h3>
                            <MediaUploader
                                onUpload={(urls) => setPropertyData(p => ({ ...p, photos: urls }))}
                                currentMedia={propertyData.photos || []}
                                multiple
                                accept="image/*"
                            >
                                {t('upload_media')}
                            </MediaUploader>
                             <div className="flex justify-between mt-6"><button type="button" onClick={prevStep} className="btn-secondary">{t('back')}</button><button type="button" onClick={nextStep} className="btn-primary">{t('continue')}</button></div>
                        </div>
                    );
                }
                return (
                    <div>
                         <h3 className="text-xl font-bold text-center mb-4">{t('upload_media')}</h3>
                        <MediaUploader
                            onUpload={(urls) => setAdData(p => ({ ...p, mediaUrls: urls, coverImageUrl: urls[0] }))}
                            currentMedia={adData.mediaUrls || []}
                            multiple={adType === 'image'}
                            accept={adType === 'image' ? 'image/*' : 'video/*'}
                        >
                            {adType === 'image' ? t('upload_multiple_images') : t('upload_video')}
                        </MediaUploader>

                        <div className="mt-8 pt-6 border-t border-dashed border-[var(--border-color)]">
                             <h3 className="text-xl font-bold text-center mb-4 text-[var(--primary)]">{t('need_pro_media')}</h3>
                             <p className="text-center text-sm text-[var(--text-secondary)] mb-4">{t('norbs_service_promo')}</p>
                             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                 <button type="button" onClick={() => navigate(Page.MarketingServices)} className="btn-secondary-pro group">
                                     <VideoCameraIcon className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
                                     <span>{t('order_promo_video')}</span>
                                 </button>
                                 <button type="button" onClick={() => navigate(Page.MarketingServices)} className="btn-secondary-pro group">
                                     <CameraIcon className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
                                     <span>{t('book_photoshoot')}</span>
                                 </button>
                             </div>
                        </div>
                         <div className="flex justify-between mt-6"><button type="button" onClick={prevStep} className="btn-secondary">{t('back')}</button><button type="button" onClick={nextStep} className="btn-primary">{t('continue')}</button></div>
                    </div>
                );
            case 4:
                if (adType === 'property') {
                     const previewPropertyData: PropertyListing = {
                        id: 999,
                        businessId: userBusiness?.id || 0,
                        title: propertyData.title,
                        address: { street: propertyData.street, postalCode: propertyData.postalCode, city: propertyData.city, country: 'Netherlands' },
                        status: propertyData.status, type: propertyData.type, price: Number(propertyData.price),
                        livingArea: Number(propertyData.livingArea), bedrooms: Number(propertyData.bedrooms), bathrooms: Number(propertyData.bathrooms),
                        yearBuilt: Number(propertyData.yearBuilt), energyLabel: propertyData.energyLabel, description: propertyData.description,
                        photos: propertyData.photos.length > 0 ? propertyData.photos : ['https://picsum.photos/800/600'],
                    };
                    return (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-center mb-4">{t('live_preview')}</h3>
                            <p className="text-sm text-center text-[var(--text-secondary)] -mt-4">{t('this_is_how_your_ad_will_look')}</p>
                            <div className="max-w-sm mx-auto">
                                {userBusiness ? <PropertyCard listing={previewPropertyData} /> : <PropertyCardSkeleton />}
                            </div>
                            <div className="flex justify-between mt-6">
                                <button type="button" onClick={prevStep} className="btn-secondary">{t('back')}</button>
                                <button type="button" onClick={handleFinalSubmit} disabled={isLoading} className="btn-primary">{isLoading ? t('publishing') : t('publish_ad')}</button>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-1">{t('define_your_offer')}</h3>
                            <label className="input-label">{t('discount_percentage')}</label>
                            <input type="number" value={adData.discountPercentage || ''} onChange={e => setAdData(p => ({ ...p, discountPercentage: Number(e.target.value) }))} className="input-field" placeholder="10" aria-label={t('discount_percentage')} />
                            <p className="text-xs text-[var(--text-muted)] mt-1">{t('optional_for_deals_page')}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">{t('structure_your_description')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="input-label">{t('main_customer_benefit')}</label>
                                    <textarea value={adData.structuredDescription?.benefit || ''} onChange={e => setAdData(p => ({ ...p, structuredDescription: { ...p.structuredDescription!, benefit: e.target.value } }))} rows={2} className="input-field" placeholder={t('what_is_the_main_advantage')} />
                                </div>
                                <div>
                                    <label className="input-label">{t('key_product_features')}</label>
                                    <textarea value={adData.structuredDescription?.features || ''} onChange={e => setAdData(p => ({ ...p, structuredDescription: { ...p.structuredDescription!, features: e.target.value } }))} rows={2} className="input-field" placeholder={t('list_2_3_key_features')} />
                                </div>
                                <div>
                                    <label className="input-label">{t('how_it_solves_problem')}</label>
                                    <textarea value={adData.structuredDescription?.solution || ''} onChange={e => setAdData(p => ({ ...p, structuredDescription: { ...p.structuredDescription!, solution: e.target.value } }))} rows={2} className="input-field" placeholder={t('describe_the_solution_you_offer')} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">{t('call_to_action')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">{t('button_text')}</label>
                                    <input value={adData.callToAction?.text || ''} onChange={e => setAdData(p => ({ ...p, callToAction: { ...p.callToAction!, text: e.target.value } }))} className="input-field" placeholder={t('e_g_buy_now')} />
                                </div>
                                <div>
                                    <label className="input-label">{t('button_link')}</label>
                                    <input type="url" value={adData.callToAction?.link || ''} onChange={e => setAdData(p => ({ ...p, callToAction: { ...p.callToAction!, link: e.target.value } }))} className="input-field" placeholder={t('https_your_website_com_product')} />
                                </div>
                            </div>
                        </div>
                         <div className="flex justify-between mt-6">
                            <button type="button" onClick={prevStep} className="btn-secondary">{t('back')}</button>
                            <button type="button" onClick={nextStep} className="btn-primary">{t('continue')}</button>
                        </div>
                    </div>
                );
            case 5:
                return (
                     <div className="space-y-6">
                        <h3 className="text-xl font-bold text-center mb-4">{t('live_preview')}</h3>
                        <p className="text-sm text-center text-[var(--text-secondary)] -mt-4">{t('this_is_how_your_ad_will_look')}</p>
                        {businessStatus === FetchStatus.Success && userBusiness ? (
                            <div className="max-w-sm mx-auto">
                                <AdCard ad={{...adData, id: 999, businessId: userBusiness.id, likeCount: 0, commentCount: 0, business: userBusiness} as AdWithBusiness} />
                            </div>
                        ) : <AdCardSkeleton />}
                        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                        <div className="flex justify-between mt-6">
                            <button type="button" onClick={prevStep} className="btn-secondary">{t('back')}</button>
                            <button type="button" onClick={handleFinalSubmit} disabled={isLoading} className="btn-primary">{isLoading ? t('publishing') : t('publish_ad')}</button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <style>{`
                .input-label { font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-size: 0.875rem; }
                .input-field { width: 100%; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: 0.375rem; padding: 0.75rem 1rem; color: var(--text-primary); transition: border-color 0.2s, box-shadow 0.2s; }
                .input-field:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent); }
                .btn-primary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--primary-text); background-color: var(--primary); border-radius: 9999px; transition: opacity 0.3s; }
                .btn-primary:hover { opacity: 0.9; }
                .btn-secondary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--text-primary); background-color: var(--border-color); border-radius: 9999px; transition: background-color 0.3s; }
                .btn-secondary:hover { background-color: var(--border-color-alt); }
                .btn-secondary-pro { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--text-primary); background-color: transparent; border: 2px solid #581c87; border-radius: 9999px; transition: all 0.3s; }
                .btn-secondary-pro:hover { background-color: #581c87; color: white; }
                .ad-type-card { background-color: var(--background-alt); border: 2px solid var(--border-color); border-radius: 0.5rem; padding: 2rem; text-align: center; transition: border-color 0.3s, transform 0.3s; }
                .ad-type-card:hover { border-color: var(--primary); transform: translateY(-4px); }
            `}</style>
            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-[var(--primary)]">{t('add_your_ad')}</h1>
                    <p className="text-[var(--text-secondary)] mt-2">{t('share_your_business')}</p>
                </header>
                <div className="mb-10">
                    <StepIndicator currentStep={step} steps={steps} />
                </div>
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-8 min-h-[300px]">
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
};

export default AddAdPage;
