import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { CATEGORIES, CITIES } from '../src/constants';
import { Page, FetchStatus, Business, Category, CV } from '../src/types';
import BusinessProfileSkeleton from '../components/skeletons/BusinessProfileSkeleton';
import { CameraIcon, CheckCircleIcon, EnvelopeIcon, FacebookIcon, GlobeAltIcon, InstagramIcon, LinkedinIcon, MapPinIcon, PhoneIcon, TikTokIcon, TwitterIcon, BanknotesIcon, UserIcon, ArrowLeftIcon } from '../components/icons/Icons';



const ImageUploader: React.FC<{
    label: string;
    currentImageUrl: string;
    onImageChange: (file: File) => void;
    aspectRatio?: 'aspect-square' | 'aspect-video';
}> = ({ label, currentImageUrl, onImageChange, aspectRatio = 'aspect-square' }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            onImageChange(file);
        }
    };
    
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`relative group ${aspectRatio} w-full max-w-[200px] rounded-lg overflow-hidden border-2 border-[var(--border-color)]`}>
                {(previewUrl || currentImageUrl) ? (
                    <img 
                        src={previewUrl || currentImageUrl} 
                        alt={label} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = '/api/placeholder/200/200';
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <CameraIcon className="w-12 h-12 text-gray-400" />
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Upload ${label}`}
                >
                    <CameraIcon className="w-8 h-8 text-white" />
                    <span className="text-white text-sm font-semibold mt-1">{label}</span>
                </button>
            </div>
             <p className="text-xs text-center text-[var(--text-secondary)]">{t('need_professional_design')} <button type="button" onClick={() => navigate(Page.MarketingServices)} className="text-[var(--primary)] hover:underline font-semibold">{t('contact_norbs_service')}</button></p>
            <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-label={label} />
        </div>
    );
};

const SettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const user = useStore(state => state.user);
    const [business, setBusiness] = useState<Business | null>(null);
    const [status, setStatus] = useState(FetchStatus.Idle);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCvModalOpen, setIsCvModalOpen] = useState(false);


    const fetchBusiness = useCallback(async () => {
        if (!user) return;
        setStatus(FetchStatus.Loading);
        try {
            const fetchedBusiness = await api.fetchBusinessByOwnerId(user.id);
            setBusiness(fetchedBusiness);
            setStatus(FetchStatus.Success);
        } catch (e: any) {
            setError(e.message);
            setStatus(FetchStatus.Error);
        }
    }, [user]);

    useEffect(() => {
        fetchBusiness();
    }, [fetchBusiness]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (!business) return;

        const keys = name.split('.');
        if (keys.length > 1) {
            // Handle nested address fields
            setBusiness({
                ...business,
                address: { 
                    ...business.address, 
                    [keys[1]]: value 
                }
            });
        } else {
            // Handle direct business fields with proper typing
            setBusiness({ 
                ...business, 
                [name]: value 
            });
        }
    };
    
    // Handle image upload with proper error handling and validation
    const handleImageChange = (field: 'logoUrl' | 'coverImageUrl') => (file: File) => {
        if (!business) return;
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            useStore.getState().showToast('Image size must be less than 5MB', 'error');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            useStore.getState().showToast('Please select a valid image file', 'error');
            return;
        }
        
        const tempUrl = URL.createObjectURL(file);
        setBusiness({ ...business, [field]: tempUrl });
        
        // Show success message
        useStore.getState().showToast(
            field === 'logoUrl' ? 'Logo updated successfully!' : 'Cover image updated successfully!', 
            'success'
        );
    };

    const handleSaveCv = async (newCvData: CV) => {
        if (!business) return;
        setIsSaving(true);
        const updatedBusiness = { ...business, cv: newCvData };
        try {
            await api.updateBusiness(updatedBusiness);
            setBusiness(updatedBusiness);
            setIsCvModalOpen(false);
            useStore.getState().showToast('CV updated successfully!', 'success');
        } catch (err) {
            useStore.getState().showToast('Failed to update CV.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business) return;
        setIsSaving(true);
        setError(null);
        try {
            await api.updateBusiness(business);
            useStore.getState().showToast(t('profile_updated_success'), 'success');
        } catch (err: any) {
            setError(t('error_profile_update_failed'));
        } finally {
            setIsSaving(false);
        }
    };

    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return <BusinessProfileSkeleton />;
    }
    
    if (status === FetchStatus.Error || !business) {
        return <div className="text-center py-10 text-red-500">{t('error_loading_data')}: {error}</div>
    }

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <style>{`
                .input-field { width: 100%; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: 0.375rem; padding: 0.75rem 1rem; color: var(--text-primary); transition: border-color 0.2s, box-shadow 0.2s; }
                .input-field:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent); }
                .btn-primary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--primary-text); background-color: var(--primary); border-radius: 9999px; transition: opacity 0.3s; cursor: pointer; }
                .btn-primary:hover { opacity: 0.9; }
                .disabled\\:opacity-50:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>

            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <div className="flex items-center gap-4 mb-6">
                        <button 
                            onClick={() => useStore.getState().navigate(Page.Dashboard)}
                            className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors"
                            aria-label="Go back to dashboard"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-[var(--text-primary)]" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-[var(--primary)]">{t('settings_title')}</h1>
                            <p className="text-[var(--text-secondary)] mt-1">{t('settings_subtitle')}</p>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Visuals */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                         <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings_section_visuals')}</h2>
                         <div className="flex flex-col sm:flex-row justify-around items-center gap-6">
                            <ImageUploader label={t('settings_change_logo')} currentImageUrl={business.logoUrl} onImageChange={handleImageChange('logoUrl')} aspectRatio="aspect-square" />
                            <ImageUploader label={t('settings_change_cover')} currentImageUrl={business.coverImageUrl} onImageChange={handleImageChange('coverImageUrl')} aspectRatio="aspect-video" />
                         </div>
                    </div>

                    {/* Core Details */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings_section_details')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="business-name" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('business_name')}</label>
                                <input 
                                    id="business-name"
                                    name="nameKey" 
                                    value={business.nameKey} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('business_name')}
                                />
                            </div>
                            <div>
                                <label htmlFor="business-category" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('business_category')}</label>
                                <select 
                                    id="business-category"
                                    name="categoryKey" 
                                    value={business.categoryKey} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('business_category')}
                                >
                                    <option value="">{t('all_categories')}</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="business-description" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('business_description')}</label>
                            <textarea 
                                id="business-description"
                                name="descriptionKey" 
                                value={business.descriptionKey} 
                                onChange={handleInputChange} 
                                rows={4} 
                                className="input-field"
                                aria-label={t('business_description')}
                            />
                        </div>
                    </div>

                     {/* Legal & Financial Details */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings_section_legal')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="kvk-number" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('kvk_number')}</label>
                                <input 
                                    id="kvk-number"
                                    name="kvkNumber" 
                                    value={business.kvkNumber} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('kvk_number')}
                                />
                            </div>
                            <div>
                                <label htmlFor="btw-number" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('btw_number')}</label>
                                <input 
                                    id="btw-number"
                                    name="btwNumber" 
                                    value={business.btwNumber} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('btw_number')}
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="iban" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('iban')}</label>
                            <input 
                                id="iban"
                                name="iban" 
                                value={business.iban} 
                                onChange={handleInputChange} 
                                className="input-field"
                                aria-label={t('iban')}
                            />
                        </div>
                    </div>
                    
                    {/* Location & Contact */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings_section_location')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="street-address" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('street_address')}</label>
                                <input 
                                    id="street-address"
                                    name="address.street" 
                                    value={business.address.street} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('street_address')}
                                />
                            </div>
                            <div>
                                <label htmlFor="phone-number" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('phone_number')}</label>
                                <input 
                                    id="phone-number"
                                    name="phone" 
                                    type="tel" 
                                    value={business.phone} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('phone_number')}
                                />
                            </div>
                            <div>
                                <label htmlFor="postal-code" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('postal_code')}</label>
                                <input 
                                    id="postal-code"
                                    name="address.postalCode" 
                                    value={business.address.postalCode} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('postal_code')}
                                />
                            </div>
                            <div>
                                <label htmlFor="business-city" className="font-semibold text-[var(--text-secondary)] mb-1 block">{t('city')}</label>
                                <select 
                                    id="business-city"
                                    name="address.city" 
                                    value={business.address.city} 
                                    onChange={handleInputChange} 
                                    className="input-field"
                                    aria-label={t('city')}
                                >
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                         <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings_section_links')}</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             <div className="relative"><input name="website" type="url" value={business.website || ''} onChange={handleInputChange} placeholder={t('website_url')} className="input-field pl-10" aria-label={t('website_url')} /><GlobeAltIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                             <div className="relative"><input name="googleMapsUrl" type="url" value={business.googleMapsUrl || ''} onChange={handleInputChange} placeholder={t('google_maps_url')} className="input-field pl-10" aria-label={t('google_maps_url')} /><MapPinIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                             <div className="relative"><input name="instagram" type="url" value={business.instagram || ''} onChange={handleInputChange} placeholder={t('instagram_url')} className="input-field pl-10" aria-label={t('instagram_url')} /><InstagramIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                             <div className="relative"><input name="facebook" type="url" value={business.facebook || ''} onChange={handleInputChange} placeholder={t('facebook_url')} className="input-field pl-10" aria-label={t('facebook_url')} /><FacebookIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                             <div className="relative"><input name="tiktokUrl" type="url" value={business.tiktokUrl || ''} onChange={handleInputChange} placeholder={t('tiktok_url')} className="input-field pl-10" aria-label={t('tiktok_url')} /><TikTokIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                             <div className="relative"><input name="twitter" type="url" value={business.twitter || ''} onChange={handleInputChange} placeholder={t('twitter_url')} className="input-field pl-10" aria-label={t('twitter_url')} /><TwitterIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                             <div className="relative"><input name="linkedin" type="url" value={business.linkedin || ''} onChange={handleInputChange} placeholder={t('linkedin_url')} className="input-field pl-10" aria-label={t('linkedin_url')} /><LinkedinIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                             <div className="relative"><input name="otherLinkUrl" type="url" value={business.otherLinkUrl || ''} onChange={handleInputChange} placeholder={t('other_link_url')} className="input-field pl-10" aria-label={t('other_link_url')} /><GlobeAltIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" /></div>
                         </div>
                    </div>

                    {/* CV Section */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--border-color-alt)] rounded-lg flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                                <UserIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('settings_section_cv')}</h2>
                                <p className="text-sm text-[var(--text-secondary)]">{t('settings_cv_description')}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <button type="button" onClick={() => setIsCvModalOpen(true)} className="btn-primary">
                                {business.cv ? t('edit_your_cv') : t('add_your_cv')}
                            </button>
                        </div>
                    </div>


                    {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50 min-w-[150px]">
                            {isSaving ? t('saving') : t('save_changes')}
                        </button>
                    </div>
                </form>
            </div>

            {isCvModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">{t('cv_editor')}</h3>
                        <p className="text-gray-600 mb-4">{t('cv_editor_info')}</p>
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => setIsCvModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
