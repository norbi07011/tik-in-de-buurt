import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AdWithBusiness } from '../src/types';
import { PlayIcon, VerifiedIcon } from './icons/Icons';

const AdCard: React.FC<{ ad: AdWithBusiness }> = ({ ad }) => {
    const { t } = useTranslation();
    const { business } = ad;

    return (
        <div className="glass-card-style overflow-hidden group">
            <div className="relative">
                {ad.mediaType === 'image' ? (
                    <img src={ad.mediaUrls[0]} alt={ad.title} className="w-full h-40 object-cover" />
                ) : (
                    <div className="relative w-full h-40 bg-black">
                         <video
                            className="w-full h-full object-cover"
                            loop
                            muted
                            playsInline
                            src={ad.mediaUrls[0]}
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayIcon className="w-12 h-12 text-white/80" />
                        </div>
                    </div>
                )}
                {ad.discountPercentage && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                        -{ad.discountPercentage}%
                    </div>
                )}
                 {ad.isSponsored && (
                    <div className="absolute top-2 left-2 bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                        {t('sponsored')}
                    </div>
                )}
            </div>
            <div className="p-4 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <img src={business.logoUrl} alt={t(business.nameKey)} className="w-10 h-10 rounded-full border-2 border-[var(--border-color)]" />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{t(business.nameKey)}</h4>
                            {business.isVerified && <VerifiedIcon className="w-4 h-4 text-[var(--primary)]" />}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{business.address.city}</p>
                    </div>
                </div>
                <h3 className="font-bold text-[var(--text-primary)] truncate" title={ad.title}>{ad.title}</h3>
                 <div className="flex flex-wrap gap-2 mt-2">
                    {ad.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-[var(--border-color-alt)] text-[var(--text-secondary)] text-xs px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdCard;
