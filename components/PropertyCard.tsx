import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { Page, PropertyListing } from '../src/types';
import { BedIcon, ArrowsPointingOutIcon, MapPinIcon, BookmarkIcon, BookmarkIconSolid, ShowerIcon } from './icons/Icons';

interface PropertyCardProps {
    listing: PropertyListing;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ listing }) => {
    const { t } = useTranslation();
    const { navigate, savedPropertyIds, toggleSaveProperty } = useStore();
    
    const isSaved = savedPropertyIds.includes(listing.id);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
    };
    
    const handleSaveClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking the save icon
        toggleSaveProperty(listing.id);
    };

    return (
        <div 
            className="premium-card bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => navigate(Page.PropertyListing, listing.id)}
        >
            <div className="relative h-48 bg-[var(--border-color-alt)] overflow-hidden">
                <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                    {t(listing.status)}
                </div>
                <button 
                    onClick={handleSaveClick}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    aria-label={isSaved ? t('remove_property') : t('save_property')}
                >
                    {isSaved ? <BookmarkIconSolid className="w-5 h-5 text-[var(--primary)]" /> : <BookmarkIcon className="w-5 h-5" />}
                </button>
            </div>
            <div className="p-4">
                <p className="font-bold text-xl text-[var(--text-primary)]">{formatPrice(listing.price)} {listing.status === 'for_rent' && '/ month'}</p>
                <h3 className="font-semibold text-[var(--text-secondary)] truncate" title={listing.title}>{listing.title}</h3>
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-1">
                    <MapPinIcon className="w-4 h-4" />
                    {listing.address.street}, {listing.address.city}
                </p>
                <div className="flex justify-start items-center gap-4 mt-3 pt-3 border-t border-[var(--border-color-alt)] text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5">
                        <BedIcon className="w-5 h-5 text-[var(--primary)]"/>
                        <span className="font-semibold text-[var(--text-primary)]">{listing.bedrooms}</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <ShowerIcon className="w-5 h-5 text-[var(--primary)]"/>
                        <span className="font-semibold text-[var(--text-primary)]">{listing.bathrooms}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ArrowsPointingOutIcon className="w-5 h-5 text-[var(--primary)]"/>
                        <span className="font-semibold text-[var(--text-primary)]">{listing.livingArea} m²</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
