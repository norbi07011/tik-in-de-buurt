import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { FetchStatus, Page, Business, AdWithBusiness } from '../src/types';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import SubscriptionWidget from '../components/dashboard/SubscriptionWidget';
import TopAdsWidget from '../components/dashboard/TopAdsWidget';
import ImprovedBusinessDashboard from '../components/dashboard/ImprovedBusinessDashboard';
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

    if (!user?.businessId) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">{t('no_business_found')}</p>
                    <button
                        onClick={() => navigate(Page.BusinessRegistration)}
                        className="btn-primary"
                    >
                        {t('register_business')}
                    </button>
                </div>
            </div>
        );
    }

    // Use the improved dashboard component
    return <ImprovedBusinessDashboard />;
};

export default DashboardPage;
