import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { Page, Freelancer } from '../src/types';
import { StarIcon, MapPinIcon } from './icons/Icons';

interface FreelancerCardProps {
    freelancer: Freelancer;
}

const FreelancerCard: React.FC<FreelancerCardProps> = ({ freelancer }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);

    return (
        <div 
            className="premium-card bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer group text-center"
            onClick={() => navigate(Page.FreelancerProfile, freelancer.id)}
        >
            <div className="relative pt-16">
                 {/* FIX: Use nameKey for alt text translation */}
                 <img src={freelancer.profileImageUrl} alt={t(freelancer.nameKey)} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-[var(--border-color)] group-hover:border-[var(--primary)] transition-colors duration-300" />
            </div>
            <div className="p-4">
                {/* FIX: Use nameKey for displaying the name */}
                <h3 className="font-bold text-[var(--text-primary)] text-lg">{t(freelancer.nameKey)}</h3>
                <p className="text-sm text-[var(--primary)] font-semibold">{t(freelancer.specializationKey)}</p>
                <div className="flex justify-center items-center gap-4 mt-3 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4"/>
                        <span>{freelancer.city}</span>
                    </div>
                     <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-400"/>
                        <span className="text-[var(--text-primary)] font-semibold">{freelancer.rating.toFixed(1)}</span>
                        <span>({freelancer.reviewCount})</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FreelancerCard;
