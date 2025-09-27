import React from 'react';
import { useTranslation } from 'react-i18next';
import { AdWithBusiness, Page } from '../../src/types';
import { StarIcon, ChatBubbleOvalLeftEllipsisIcon, ChartPieIcon } from '../../components/icons/Icons';
import { useStore } from '../../src/store';

const TopAdsWidget: React.FC<{ ads: AdWithBusiness[] }> = ({ ads }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);

    return (
        <div className="glass-card-style p-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('top_performing_ads')}</h2>
            <div className="space-y-4">
                {ads.length > 0 ? ads.map(ad => (
                    <div key={ad.id} className="flex items-center gap-4 bg-black/20 p-3 rounded-lg">
                        <img src={ad.coverImageUrl || ad.mediaUrls[0]} alt={ad.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{ad.title}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                <span className="flex items-center gap-1"><StarIcon className="w-4 h-4 text-yellow-400" /> {ad.likeCount}</span>
                                <span className="flex items-center gap-1"><ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 text-blue-400" /> {ad.commentCount}</span>
                            </div>
                        </div>
                        <button onClick={() => { /* Open ad analytics modal in future */ alert('Ad analytics coming soon!') }} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                            <ChartPieIcon className="w-5 h-5" />
                        </button>
                    </div>
                )) : (
                    <div className="text-center py-8">
                        <p className="text-gray-400">{t('No ads created yet.')}</p>
                        <button onClick={() => navigate(Page.AddAd)} className="mt-4 text-sm font-semibold text-[var(--primary)] hover:underline">
                            {t('create_new_ad')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopAdsWidget;
