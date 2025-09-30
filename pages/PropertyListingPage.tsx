import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Page, FetchStatus, PropertyListing, Business } from '../src/types';
import { api } from '../src/api';
import { useStore } from '../src/store';
import { ArrowLeftIcon, BedIcon, ArrowsPointingOutIcon, CalendarDaysIcon, MapPinIcon, VerifiedIcon, ShowerIcon, BoltIcon, ArrowRightIcon, XMarkIcon, BanknotesIcon, BuildingOffice2Icon, Squares2X2Icon, PencilSquareIcon, CheckCircleIcon } from '../components/icons/Icons';
import BusinessMap from '../components/BusinessMap';
import PropertyListingSkeleton from '../components/skeletons/PropertyListingSkeleton';

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

const EditableDetailItem: React.FC<{ icon?: React.ReactNode; label: string; value: React.ReactNode; isEditing: boolean; name: string; onUpdate: (name: string, value: any) => void; type?: string; children?: React.ReactNode }> = ({ icon, label, value, isEditing, name, onUpdate, type = 'text', children }) => {
    if (!isEditing && !value) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onUpdate(name, e.target.value);
    };

    return (
        <div className="flex items-start gap-3 py-3 border-b glass-card-divider last:border-b-0">
            {icon && <div className="text-[var(--primary)] flex-shrink-0 mt-1">{icon}</div>}
            <div className="flex-1 flex justify-between items-center">
                <span className="text-[var(--text-secondary)] text-sm">{label}</span>
                {isEditing ? (
                    children || <input type={type} value={value as string || ''} onChange={handleChange} className="w-1/2 text-right bg-transparent text-[var(--text-primary)] font-semibold border-b border-dashed border-[var(--border-color)] focus:outline-none focus:border-[var(--primary)]" />
                ) : (
                    <span className="text-[var(--text-primary)] font-semibold text-right">{value}</span>
                )}
            </div>
        </div>
    );
};

const CharacteristicSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => {
    return (
        <div className="glass-card-style p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">{icon} {title}</h3>
            <div className="space-y-1">{children}</div>
        </div>
    );
};

const PropertyGallery: React.FC<{ images: string[] }> = ({ images }) => {
    const { t } = useTranslation();
    if (images.length === 0) {
        return <div className="glass-card-style text-center text-[var(--text-secondary)] py-10">{t('gallery_no_images_found')}</div>;
    }
    return (
        <div className="glass-card-style p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, index) => (
                    <div key={index} className="aspect-square bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer group">
                        <img src={img} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                ))}
            </div>
        </div>
    );
};

type Tab = 'information' | 'gallery' | 'contact_location';

const PropertyListingPage: React.FC<{ propertyId: number }> = ({ propertyId }) => {
    const { t } = useTranslation();
    const { navigate, user } = useStore();
    
    const [listing, setListing] = useState<PropertyListing | null>(null);
    const [agent, setAgent] = useState<Business | null>(null);
    const [status, setStatus] = useState<FetchStatus>(FetchStatus.Idle);
    const [error, setError] = useState<Error | null>(null);
    
    const [activeTab, setActiveTab] = useState<Tab>('information');

    const [isEditing, setIsEditing] = useState(false);
    const [editedListing, setEditedListing] = useState<PropertyListing | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const isOwner = user && agent && user.businessId === agent.id;

    const fetchData = useCallback(async (id: number) => {
        setStatus(FetchStatus.Loading);
        setError(null);
        try {
            const fetchedListing = await api.fetchPropertyListingById(id);
            setListing(fetchedListing);
            setEditedListing(fetchedListing);
            const fetchedAgent = await api.fetchBusinessById(fetchedListing.businessId.toString());
            setAgent(fetchedAgent);
            setStatus(FetchStatus.Success);
        } catch (err) {
            setError(err as Error);
            setStatus(FetchStatus.Error);
        }
    }, []);

    useEffect(() => {
        fetchData(propertyId);
    }, [propertyId, fetchData]);

    const formatPrice = (price: number) => {
        if (!price) return '-';
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
    };

    const handleUpdate = (name: string, value: any) => {
        if(editedListing) {
            setEditedListing({ ...editedListing, [name]: value });
        }
    };

    const handleSaveEdit = async () => {
        if (!editedListing) return;
        setIsSaving(true);
        try {
            const updatedListing = await api.updatePropertyListing(editedListing);
            setListing(updatedListing);
            setEditedListing(updatedListing);
            setIsEditing(false);
        } catch (err) {
            // Handle error, maybe show a toast
        } finally {
            setIsSaving(false);
        }
    };
    
    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return <PropertyListingSkeleton />;
    }
    
    if (status === FetchStatus.Error || !listing || !agent || !editedListing) {
        return (
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-5xl mx-auto">
                    <ErrorDisplay message={error?.message || 'Listing not found'} onRetry={() => fetchData(propertyId)} />
                </div>
            </div>
        );
    }
    
    const tabs: {id: Tab, label: string}[] = [
        { id: 'information', label: 'information' },
        { id: 'gallery', label: 'gallery' },
        { id: 'contact_location', label: 'contact_location' }
    ];

    const renderTabContent = () => {
        switch(activeTab) {
            case 'information':
                return (
                     <div className="space-y-6">
                        <div className="glass-card-style p-6">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('description')}</h3>
                            {isEditing ? (
                                <textarea value={editedListing.description} onChange={(e) => handleUpdate('description', e.target.value)} rows={6} className="w-full bg-transparent text-[var(--text-secondary)] leading-relaxed whitespace-pre-line border border-dashed border-[var(--border-color)] focus:outline-none focus:border-[var(--primary)] p-2 rounded" />
                            ) : (
                                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{listing.description}</p>
                            )}
                        </div>
                        <div id="characteristics">
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('characteristics_title')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CharacteristicSection icon={<BanknotesIcon className="w-6 h-6"/>} title={t('transfer_title')}>
                                    <EditableDetailItem label={t('asking_price')} value={formatPrice(editedListing.price)} isEditing={isEditing} name="price" onUpdate={handleUpdate} type="number" />
                                    <EditableDetailItem label={t('availability_status')} value={listing.availabilityStatus} isEditing={isEditing} name="availabilityStatus" onUpdate={handleUpdate} />
                                    <EditableDetailItem label={t('offered_since')} value={listing.offeredSince} isEditing={isEditing} name="offeredSince" onUpdate={handleUpdate} />
                                </CharacteristicSection>

                                <CharacteristicSection icon={<BuildingOffice2Icon className="w-6 h-6"/>} title={t('construction_title')}>
                                    <EditableDetailItem label={t('type_of_house')} value={t(listing.type)} isEditing={false} name="type" onUpdate={() => {}} />
                                    <EditableDetailItem label={t('year_built')} value={listing.yearBuilt} isEditing={isEditing} name="yearBuilt" onUpdate={handleUpdate} type="number"/>
                                </CharacteristicSection>
                                
                                <CharacteristicSection icon={<Squares2X2Icon className="w-6 h-6"/>} title={t('surfaces_title')}>
                                    <EditableDetailItem label={t('living_area')} value={`${editedListing.livingArea} m²`} isEditing={isEditing} name="livingArea" onUpdate={handleUpdate} type="number"/>
                                    <EditableDetailItem label={t('plot_size')} value={editedListing.plotSize ? `${editedListing.plotSize} m²` : '-'} isEditing={isEditing} name="plotSize" onUpdate={handleUpdate} type="number"/>
                                </CharacteristicSection>

                                <CharacteristicSection icon={<BoltIcon className="w-6 h-6"/>} title={t('energy_title')}>
                                     <EditableDetailItem label={t('energy_label')} value={listing.energyLabel} isEditing={isEditing} name="energyLabel" onUpdate={handleUpdate} />
                                </CharacteristicSection>
                            </div>
                        </div>
                    </div>
                );
            case 'gallery':
                return <PropertyGallery images={listing.photos} />;
            case 'contact_location':
                return (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 glass-card-style p-6">
                            <BusinessMap address={listing.address} />
                        </div>
                        <div className="md:col-span-1 glass-card-style p-6 text-center">
                            <p className="text-sm text-[var(--text-secondary)] mb-2">{t('listed_by')}</p>
                            <img src={agent.logoUrl} alt={t(agent.nameKey)} className="w-20 h-20 rounded-full mx-auto border-4 border-[var(--background)]"/>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{t(agent.nameKey)}</h3>
                                {agent.isVerified && <VerifiedIcon className="w-6 h-6 text-[var(--primary)]" />}
                            </div>
                            <button onClick={() => navigate(Page.BusinessProfile, agent.id)} className="mt-4 w-full px-6 py-3 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300">
                                {t('view_profile')}
                            </button>
                        </div>
                    </div>
                );
        }
    }
    
    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(Page.RealEstate)} className="mb-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-2">
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>{t('back_to_properties')}</span>
                </button>

                {/* Header Section */}
                <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-[-80px]">
                    <img src={listing.photos[0]} alt={`${listing.title} cover`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
                
                <div className="relative glass-card-style p-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                        <img src={agent.logoUrl} alt={`${t(agent.nameKey)} logo`} className="w-28 h-28 rounded-md border-4 border-black dark:border-[var(--background)] object-cover -mt-16" />
                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{listing.title}</h1>
                            <p className="text-[var(--text-secondary)]">{listing.address.street}, {listing.address.city}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-3xl font-extrabold text-[var(--primary)]">{formatPrice(listing.price)}</p>
                             {isOwner && (
                                <div className="mt-2">
                                    {isEditing ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setIsEditing(false); setEditedListing(listing); }} className="px-4 py-2 text-sm font-bold bg-[var(--border-color)] text-[var(--text-primary)] rounded-full hover:bg-[var(--border-color-alt)]">{t('cancel')}</button>
                                            <button onClick={handleSaveEdit} disabled={isSaving} className="px-4 py-2 text-sm font-bold bg-green-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 flex items-center gap-2">{isSaving ? t('saving') : <><CheckCircleIcon className="w-5 h-5"/>{t('save')}</>}</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm font-bold bg-[var(--primary)] text-[var(--primary-text)] rounded-full hover:opacity-90 flex items-center gap-2"><PencilSquareIcon className="w-5 h-5"/>{t('edit_listing')}</button>
                                    )}
                                </div>
                            )}
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
                                {t(tab.label)}
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Content */}
                <div className="mt-6">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default PropertyListingPage;
