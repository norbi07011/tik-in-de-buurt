import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { Page } from '../src/types';
import { CheckCircleIcon } from '../components/icons/Icons';

const SubscriptionSuccessPage: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, activeBusinessId, pendingPlanId, setPendingPlanId } = useStore();

    useEffect(() => {
        const activate = async () => {
            if (activeBusinessId && pendingPlanId) {
                try {
                    await api.activateSubscription(activeBusinessId, pendingPlanId);
                } catch (error) {
                    console.error("Failed to activate subscription:", error);
                } finally {
                    setPendingPlanId(null);
                }
            }
            setTimeout(() => {
                if(activeBusinessId) {
                    navigate(Page.BusinessProfile, activeBusinessId);
                } else {
                    navigate(Page.Account); 
                }
            }, 3000);
        };

        activate();
    }, [activeBusinessId, navigate, pendingPlanId, setPendingPlanId]);

    return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <CheckCircleIcon className="w-24 h-24 text-green-400 mb-6 animate-bounce" />
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('subscription_activated')}</h1>
            <p className="text-[var(--text-secondary)]">{t('activating_and_redirecting')}</p>
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(-10%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
                    50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
                }
                .animate-bounce {
                    animation: bounce 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

export default SubscriptionSuccessPage;
