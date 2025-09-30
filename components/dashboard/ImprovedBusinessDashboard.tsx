import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../src/store';
import { api } from '../../src/api';
import { Business, Page, FetchStatus } from '../../src/types';
import { 
    BuildingStorefrontIcon,
    Cog6ToothIcon,
    PhotoIcon,
    VideoCameraIcon,
    StarIcon,
    MegaphoneIcon,
    PencilIcon,
    EyeIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    ClockIcon,
    CalendarDaysIcon,
    CreditCardIcon,
    MapIcon
} from '../icons/Icons';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    action: () => void;
    comingSoon?: boolean;
}

interface BusinessStat {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
}

const StatCard: React.FC<{ stat: BusinessStat }> = ({ stat }) => {
    const changeColors = {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-gray-500'
    };

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                    {stat.change && (
                        <p className={`text-sm mt-1 ${changeColors[stat.changeType || 'neutral']}`}>
                            {stat.change}
                        </p>
                    )}
                </div>
                <div className="text-[var(--primary)] opacity-80">
                    {stat.icon}
                </div>
            </div>
        </div>
    );
};

const QuickActionCard: React.FC<{ action: QuickAction }> = ({ action }) => {
    return (
        <button
            onClick={action.action}
            disabled={action.comingSoon}
            className={`group relative p-6 rounded-xl border border-[var(--border-color)] bg-gradient-to-br ${action.color} hover:scale-105 transition-all duration-300 text-left w-full ${action.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
            {action.comingSoon && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-xs px-2 py-1 rounded-full text-black font-semibold">
                    Coming Soon
                </div>
            )}
            <div className="flex items-center justify-between mb-3">
                <div className="text-white text-2xl">
                    {action.icon}
                </div>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{action.title}</h3>
            <p className="text-white/80 text-sm">{action.description}</p>
        </button>
    );
};

const ImprovedBusinessDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user, navigate } = useStore();
    const [business, setBusiness] = useState<Business | null>(null);
    const [stats, setStats] = useState<BusinessStat[]>([]);
    const [status, setStatus] = useState(FetchStatus.Idle);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.businessId) return;
            
            setStatus(FetchStatus.Loading);
            try {
                const businessData = await api.fetchBusinessById(user.businessId.toString());
                setBusiness(businessData);

                // Mock stats - replace with real API data
                setStats([
                    {
                        label: t('profile_views'),
                        value: '1,234',
                        icon: <EyeIcon className="w-6 h-6" />,
                        change: '+12% this month',
                        changeType: 'positive'
                    },
                    {
                        label: t('total_ads'),
                        value: businessData.adCount || 0,
                        icon: <MegaphoneIcon className="w-6 h-6" />,
                        change: '3 active',
                        changeType: 'neutral'
                    },
                    {
                        label: t('customer_rating'),
                        value: businessData.rating?.toFixed(1) || '5.0',
                        icon: <StarIcon className="w-6 h-6" />,
                        change: `${Math.floor(Math.random() * 50 + 10)} reviews`,
                        changeType: 'neutral'
                    },
                    {
                        label: t('this_month_views'),
                        value: '567',
                        icon: <EyeIcon className="w-6 h-6" />,
                        change: '+8% vs last month',
                        changeType: 'positive'
                    }
                ]);

                // Mock recent activities
                setRecentActivities([
                    { 
                        id: 1, 
                        text: 'New review received from Maria K.', 
                        time: '2 hours ago',
                        type: 'review'
                    },
                    { 
                        id: 2, 
                        text: 'Ad "Special Winter Offer" got 25 new views', 
                        time: '4 hours ago',
                        type: 'ad'
                    },
                    { 
                        id: 3, 
                        text: 'Profile updated successfully', 
                        time: '1 day ago',
                        type: 'update'
                    }
                ]);

                setStatus(FetchStatus.Success);
            } catch (error) {
                setStatus(FetchStatus.Error);
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, [user, t]);

    const quickActions: QuickAction[] = [
        {
            id: 'create-ad',
            title: t('create_new_ad'),
            description: t('promote_your_services'),
            icon: <MegaphoneIcon className="w-6 h-6" />,
            color: 'from-blue-600 to-blue-800',
            action: () => navigate(Page.AddAd)
        },
        {
            id: 'edit-profile',
            title: t('edit_profile'),
            description: t('update_business_information'),
            icon: <PencilIcon className="w-6 h-6" />,
            color: 'from-green-600 to-green-800',
            action: () => navigate(Page.Settings)
        },
        {
            id: 'add-photos',
            title: t('add_photos_videos'),
            description: t('showcase_your_work'),
            icon: <PhotoIcon className="w-6 h-6" />,
            color: 'from-purple-600 to-purple-800',
            action: () => navigate(Page.Settings) // Navigate to gallery section in settings
        },
        {
            id: 'manage-reviews',
            title: t('manage_reviews'),
            description: t('respond_to_customer_feedback'),
            icon: <StarIcon className="w-6 h-6" />,
            color: 'from-yellow-600 to-yellow-800',
            action: () => navigate(Page.Reviews)
        },
        {
            id: 'view-analytics',
            title: t('view_analytics'),
            description: t('track_your_performance'),
            icon: <EyeIcon className="w-6 h-6" />,
            color: 'from-indigo-600 to-indigo-800',
            action: () => alert(t('analytics_coming_soon')),
            comingSoon: true
        },
        {
            id: 'payment-settings',
            title: t('payment_settings'),
            description: t('manage_subscription_billing'),
            icon: <CreditCardIcon className="w-6 h-6" />,
            color: 'from-red-600 to-red-800',
            action: () => navigate(Page.Payment)
        }
    ];

    if (status === FetchStatus.Loading) {
        return (
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-[var(--border-color)] rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-[var(--border-color)] rounded-lg"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 bg-[var(--border-color)] rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (status === FetchStatus.Error || !business) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{t('error_loading_data')}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                    >
                        {t('try_again')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                        {t('welcome_back')}, {user?.name}!
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        {t('manage_your_business')} - {business.nameKey}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(Page.BusinessProfile, business.id)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <BuildingStorefrontIcon className="w-4 h-4" />
                        {t('view_public_profile')}
                    </button>
                    <button
                        onClick={() => navigate(Page.Settings)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Cog6ToothIcon className="w-4 h-4" />
                        {t('settings')}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} stat={stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">{t('quick_actions')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickActions.map(action => (
                        <QuickActionCard key={action.id} action={action} />
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('business_overview')}</h3>
                            <button className="text-[var(--primary)] hover:underline text-sm">
                                {t('view_detailed_analytics')}
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-[var(--background-secondary)] rounded-lg">
                                <div>
                                    <p className="text-[var(--text-primary)] font-medium">{t('subscription_status')}</p>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        {business.subscriptionStatus === 'active' ? t('active_plan') : t('inactive_plan')}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${business.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {business.subscriptionStatus === 'active' ? t('active') : t('inactive')}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-[var(--background-secondary)] rounded-lg">
                                <div>
                                    <p className="text-[var(--text-primary)] font-medium">{t('profile_completion')}</p>
                                    <p className="text-[var(--text-secondary)] text-sm">{t('complete_your_profile_for_better_visibility')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-[var(--primary)]">85%</p>
                                    <button 
                                        onClick={() => navigate(Page.Settings)}
                                        className="text-[var(--primary)] hover:underline text-sm"
                                    >
                                        {t('complete_now')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('recent_activity')}</h3>
                        <div className="space-y-4">
                            {recentActivities.length > 0 ? recentActivities.map(activity => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-[var(--primary)] rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-[var(--text-primary)] text-sm">{activity.text}</p>
                                        <p className="text-[var(--text-secondary)] text-xs">{activity.time}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <ClockIcon className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
                                    <p className="text-[var(--text-secondary)]">{t('no_recent_activity')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImprovedBusinessDashboard;