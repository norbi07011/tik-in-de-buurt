import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { FetchStatus, Page, Business, AdWithBusiness } from '../src/types';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import SubscriptionWidget from '../components/dashboard/SubscriptionWidget';
import TopAdsWidget from '../components/dashboard/TopAdsWidget';
import { MegaphoneIcon, PencilIcon, ChartPieIcon } from '../components/icons/Icons';

// Skeleton for the dashboard loading state
const DashboardSkeleton: React.FC = () => (
    <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <header className="mb-8">
            <div className="h-10 w-1/3 bg-[var(--border-color-alt)] rounded"></div>
            <div className="h-6 w-1/2 bg-[var(--border-color-alt)] rounded mt-2"></div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="glass-card-style p-6 h-80"></div>
                <div className="glass-card-style p-6 h-64"></div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-card-style p-6 h-48"></div>
                <div className="glass-card-style p-6 h-96"></div>
            </div>
        </div>
    </div>
);

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors duration-200 w-full">
        <div className="w-10 h-10 mx-auto bg-black/20 rounded-full flex items-center justify-center text-white">{icon}</div>
        <span className="mt-2 block text-sm font-semibold text-gray-300">{label}</span>
    </button>
);


const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const { user, navigate } = useStore();
    const [business, setBusiness] = useState<Business | null>(null);
    const [topAds, setTopAds] = useState<AdWithBusiness[]>([]);
    const [status, setStatus] = useState(FetchStatus.Idle);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.businessId) {
                setStatus(FetchStatus.Loading);
                try {
                    const [businessData, adsData] = await Promise.all([
                        api.fetchBusinessById(user.businessId),
                        api.fetchAdsByBusinessId(user.businessId)
                    ]);
                    setBusiness(businessData);
                    // Sort ads by likes to get the top ones
                    const sortedAds = [...adsData].sort((a, b) => b.likeCount - a.likeCount).slice(0, 4);
                    setTopAds(sortedAds);
                    setStatus(FetchStatus.Success);
                } catch (e) {
                    setStatus(FetchStatus.Error);
                }
            }
        };
        fetchData();
    }, [user]);
    
    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return <DashboardSkeleton />;
    }
    
    if (status === FetchStatus.Error || !business) {
        return <div className="flex-grow flex items-center justify-center text-red-500">{t('error_loading_data')}</div>;
    }

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-white tracking-tighter">{t('dashboard')}</h1>
                <p className="text-lg text-gray-400">{t('welcome_back')}, {user?.name}!</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <PerformanceChart />
                    <TopAdsWidget ads={topAds} />
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <SubscriptionWidget business={business} />
                    <div className="glass-card-style p-6">
                        <h2 className="text-xl font-bold text-white mb-4">{t('quick_actions')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickActionButton icon={<MegaphoneIcon className="w-6 h-6"/>} label={t('create_new_ad')} onClick={() => navigate(Page.AddAd)} />
                            <QuickActionButton icon={<PencilIcon className="w-6 h-6"/>} label={t('edit_your_profile')} onClick={() => navigate(Page.Settings)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
