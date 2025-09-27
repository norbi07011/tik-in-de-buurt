import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../src/store';
import { Business, Page, SubscriptionStatus } from '../../src/types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CreditCardIcon } from '../icons/Icons';
import { MOCK_PLANS } from '../../src/constants';
import DemoPaymentModal from '../DemoPaymentModal';

const statusConfig: { [key in SubscriptionStatus]: { icon: React.ReactNode; textKey: string; color: string; } } = {
    active: { icon: <CheckCircleIcon />, textKey: 'status_active', color: 'text-green-400' },
    inactive: { icon: <XCircleIcon />, textKey: 'status_inactive', color: 'text-gray-400' },
    expired: { icon: <ClockIcon />, textKey: 'status_expired', color: 'text-yellow-400' },
    past_due: { icon: <XCircleIcon />, textKey: 'status_past_due', color: 'text-red-400' },
    canceled: { icon: <XCircleIcon />, textKey: 'status_canceled', color: 'text-yellow-400' },
};

const SubscriptionWidget: React.FC<{ business: Business }> = ({ business }) => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const plan = MOCK_PLANS.find(p => p.id === business.planId);
    const statusInfo = statusConfig[business.subscriptionStatus];

    return (
        <div className="glass-card-style p-6">
            <h2 className="text-lg font-bold text-white mb-4">{t('subscription_status')}</h2>
            
            <div className={`flex items-center gap-2 font-semibold text-lg ${statusInfo.color}`}>
                {statusInfo.icon}
                <span>{t(statusInfo.textKey)}</span>
            </div>
            
            {plan && business.subscriptionExpiresAt ? (
                <div className="mt-4">
                    <p className="font-bold text-xl text-white">{t(plan.nameKey)}</p>
                    <p className="text-sm text-gray-400">
                        {t('subscription_active_until')} {new Date(business.subscriptionExpiresAt).toLocaleDateString()}
                    </p>
                </div>
            ) : (
                 <p className="mt-4 text-sm text-gray-400">{t('your_profile_is_inactive_description')}</p>
            )}

            <div className="flex gap-2 mt-6">
                {business.subscriptionStatus === 'inactive' || business.subscriptionStatus === 'expired' ? (
                    <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="flex-1 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <CreditCardIcon className="w-4 h-4" />
                        {t('upgrade_now') || 'Upgrade Now'}
                    </button>
                ) : (
                    <button 
                        onClick={() => navigate(Page.Account)}
                        className="flex-1 py-2.5 text-sm font-bold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                        {t('manage_subscription')}
                    </button>
                )}
            </div>

            <DemoPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                businessId={business.id.toString()}
                onSuccess={() => {
                    setShowPaymentModal(false);
                    // Refresh page or update business data
                    window.location.reload();
                }}
            />
        </div>
    );
};

export default SubscriptionWidget;
