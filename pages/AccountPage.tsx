import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { Business, FetchStatus, Page, SubscriptionStatus, Plan, Invoice } from '../src/types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, InformationCircleIcon, DocumentArrowDownIcon, CheckIcon } from '../components/icons/Icons';
import BusinessProfileSkeleton from '../components/skeletons/BusinessProfileSkeleton';
import { MOCK_PLANS } from '../src/constants';
import PaymentFlipCard from '../components/PaymentFlipCard';

// --- Reusable Components for this Page ---

const StatusCard: React.FC<{ status: SubscriptionStatus; expiryDate?: string }> = ({ status, expiryDate }) => {
    const { t } = useTranslation();
    const statusConfig = {
        active: { icon: <CheckCircleIcon className="w-8 h-8 text-green-400" />, title: t('status_active'), description: expiryDate ? `${t('subscription_active_until')} ${new Date(expiryDate).toLocaleDateString()}`: '', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30'},
        inactive: { icon: <XCircleIcon className="w-8 h-8 text-gray-400" />, title: t('status_inactive'), description: t('your_profile_is_inactive'), bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30'},
        expired: { icon: <ClockIcon className="w-8 h-8 text-yellow-400" />, title: t('status_expired'), description: t('your_profile_is_inactive'), bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30'},
        past_due: { icon: <XCircleIcon className="w-8 h-8 text-red-400" />, title: t('status_past_due'), description: t('payment_failed_text'), bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30'},
        canceled: { icon: <XCircleIcon className="w-8 h-8 text-yellow-400" />, title: t('status_canceled'), description: expiryDate ? `Your access ends on ${new Date(expiryDate).toLocaleDateString()}` : '', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30'},
    };
    const config = statusConfig[status];
    return (
        <div className={`p-6 rounded-lg border ${config.bgColor} ${config.borderColor} flex items-center gap-4`}>
            {config.icon}
            <div><h3 className="font-bold text-lg text-[var(--text-primary)]">{config.title}</h3><p className="text-sm text-[var(--text-secondary)]">{config.description}</p></div>
        </div>
    );
};

const PlanSelector: React.FC<{ onSubscribe: (planId: string, finalPrice: number) => void, isLoading: boolean }> = ({ onSubscribe, isLoading }) => {
    const { t } = useTranslation();
    const [plans] = useState<Plan[]>(MOCK_PLANS);
    const [discountCodes, setDiscountCodes] = useState<{ [key: string]: string }>({});
    const [promoMessages, setPromoMessages] = useState<{ [key: string]: { textKey: string; type: 'success' | 'error' } | null }>({});
    const [appliedDiscounts, setAppliedDiscounts] = useState<{ [key: string]: number | null }>({});

    const handleCodeChange = (planId: string, code: string) => {
        setDiscountCodes(prev => ({ ...prev, [planId]: code }));
        if (promoMessages[planId]) {
            setPromoMessages(prev => ({ ...prev, [planId]: null }));
        }
    };

    const applyDiscount = (planId: string) => {
        const code = discountCodes[planId]?.toUpperCase();
        if (code === 'PROMO20') {
            setAppliedDiscounts(prev => ({ ...prev, [planId]: 20 }));
            setPromoMessages(prev => ({ ...prev, [planId]: { textKey: 'code_applied', type: 'success' } }));
        } else {
            setAppliedDiscounts(prev => ({ ...prev, [planId]: null }));
            setPromoMessages(prev => ({ ...prev, [planId]: { textKey: 'invalid_code', type: 'error' } }));
        }
    };
    
    const removeDiscount = (planId: string) => {
        setDiscountCodes(prev => ({ ...prev, [planId]: '' }));
        setAppliedDiscounts(prev => ({ ...prev, [planId]: null }));
        setPromoMessages(prev => ({ ...prev, [planId]: null }));
    };

    const getFinalPrice = (plan: Plan): number => {
        const discount = appliedDiscounts[plan.id];
        if (discount) {
            return plan.price * (1 - discount / 100);
        }
        return plan.price;
    };

    return (
        <div className="relative flex-grow w-full flex items-center justify-center overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
                <div className="absolute top-0 left-0 w-full h-full bg-red-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                {plans.map(plan => {
                    const finalPrice = getFinalPrice(plan);
                    const discountApplied = appliedDiscounts[plan.id] !== null && appliedDiscounts[plan.id] !== undefined;

                    return (
                    <div key={plan.id}
                        className={`bg-black/40 backdrop-blur-md border rounded-2xl p-6 text-white text-left flex flex-col transition-all duration-300 ${plan.isPopular ? 'border-[var(--primary)] shadow-2xl shadow-[var(--primary)]/30 scale-105' : 'border-white/20'}`}>
                        {plan.isPopular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold px-3 py-1 rounded-full">{t('most_popular')}</div>}
                        <h3 className="text-xl font-bold">{t(plan.nameKey)}</h3>
                        <div className="my-4">
                            {discountApplied && (
                                <p className="text-2xl font-extrabold text-gray-500 line-through">
                                    €{plan.price.toFixed(2)}
                                </p>
                            )}
                            <p className="text-4xl font-extrabold">
                                €{finalPrice.toFixed(2)}
                                <span className="text-base font-medium text-gray-400">/{t(plan.intervalKey)}</span>
                            </p>
                        </div>
                        {plan.priceNoteKey && <p className="text-xs font-semibold text-yellow-400 -mt-2 mb-4">{t(plan.priceNoteKey)}</p>}
                        
                        <ul className="space-y-2 text-sm text-gray-300 flex-grow">
                            {plan.features.map(feature => <li key={feature} className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0"/> {t(feature)}</li>)}
                        </ul>

                        <div className="mt-6 space-y-2">
                             <label className="text-xs font-semibold text-gray-300">{t('discount_code')}</label>
                            {discountApplied ? (
                                <div className="flex justify-between items-center">
                                    <p className="text-green-400 font-bold text-sm">{discountCodes[plan.id]?.toUpperCase()}</p>
                                    <button onClick={() => removeDiscount(plan.id)} className="text-xs text-red-400 hover:underline">{t('remove')}</button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input type="text" placeholder={t('enter_discount_code')} value={discountCodes[plan.id] || ''} onChange={e => handleCodeChange(plan.id, e.target.value)} className="w-full bg-black/30 border border-white/20 rounded-md py-1 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                                    <button onClick={() => applyDiscount(plan.id)} className="px-3 py-1 text-xs font-bold bg-white/20 rounded-md hover:bg-white/30">{t('apply')}</button>
                                </div>
                            )}
                            {promoMessages[plan.id] && <p className={`text-xs ${promoMessages[plan.id]?.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{t(promoMessages[plan.id]!.textKey)}</p>}
                        </div>

                        <button onClick={() => onSubscribe(plan.id, finalPrice)} disabled={isLoading} className={`w-full mt-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${plan.isPopular ? 'bg-[var(--primary)] text-[var(--primary-text)] hover:opacity-90' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                           {isLoading ? t('loading') : t('subscribe')}
                        </button>
                    </div>
                )})}
            </div>
            <style>{`
                 @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
};


const BillingHistory: React.FC<{ businessId: number }> = ({ businessId }) => {
    const { t } = useTranslation();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    
    useEffect(() => {
        api.fetchInvoices(businessId).then(setInvoices);
    }, [businessId]);

    const statusStyles = {
        paid: 'bg-green-500/20 text-green-300',
        open: 'bg-yellow-500/20 text-yellow-300',
        failed: 'bg-red-500/20 text-red-300',
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('billing_history')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--text-muted)] uppercase border-b glass-card-divider">
                        <tr>
                            <th scope="col" className="px-4 py-3">{t('invoice_date')}</th>
                            <th scope="col" className="px-4 py-3">{t('invoice_amount')}</th>
                            <th scope="col" className="px-4 py-3">{t('invoice_status')}</th>
                            <th scope="col" className="px-4 py-3 text-right">{t('invoice')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(invoice => (
                            <tr key={invoice.id} className="border-b glass-card-divider">
                                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{new Date(invoice.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-[var(--text-secondary)]">€{invoice.amount.toFixed(2)}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[invoice.status]}`}>{t(`status_${invoice.status}`)}</span></td>
                                <td className="px-4 py-3 text-right">
                                    <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--primary)] hover:underline flex items-center justify-end gap-1"><DocumentArrowDownIcon className="w-4 h-4"/>{t('invoice_download')}</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Main Page Component ---

const AccountPage: React.FC = () => {
    const { t } = useTranslation();
    const { user, navigate, setPendingPlanId } = useStore();
    const [business, setBusiness] = useState<Business | null>(null);
    const [status, setStatus] = useState(FetchStatus.Idle);
    const [pageIsLoading, setPageIsLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const fetchBusiness = useCallback(async () => {
        if (user?.id) {
            setStatus(FetchStatus.Loading);
            try {
                const fetchedBusiness = await api.fetchBusinessByOwnerId(parseInt(user.id));
                setBusiness(fetchedBusiness);
                setStatus(FetchStatus.Success);
            } catch (e) {
                setStatus(FetchStatus.Error);
            }
        }
    }, [user?.id]);

    useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

    const handleSubscribe = async (planId: string, finalPrice: number) => {
        if (!business) return;
        setPageIsLoading(true);
        try {
            await api.createCheckoutSession(business.id, planId);
            setPendingPlanId(planId);
            navigate(Page.SubscriptionSuccess, business.id);
        } catch (error) {
            console.error("Failed to create checkout session", error);
            setPageIsLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!business) return;
        setPageIsLoading(true);
        try {
            const updatedBusiness = await api.cancelSubscription(business.id);
            setBusiness(updatedBusiness);
        } catch (error) {
            console.error("Failed to cancel subscription", error);
        } finally {
            setPageIsLoading(false);
            setShowCancelModal(false);
        }
    };

    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return <BusinessProfileSkeleton />;
    }
    
    if (!business) {
        return <div className="text-center text-[var(--text-secondary)] py-10">Could not load business information.</div>;
    }

    const { subscriptionStatus, planId, subscriptionExpiresAt } = business;
    const isInactive = ['inactive', 'expired', 'canceled'].includes(subscriptionStatus);
    const plan = MOCK_PLANS.find(p => p.id === planId);

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-[var(--primary)]">{t('account_and_billing')}</h1>
                    <p className="text-[var(--text-secondary)] mt-2">{t(business.nameKey)}</p>
                </header>

                {subscriptionStatus === 'past_due' && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 mb-6">
                        <InformationCircleIcon className="w-10 h-10 flex-shrink-0" />
                        <div className="flex-grow text-center sm:text-left"><h3 className="font-bold">{t('payment_failed_title')}</h3><p className="text-sm opacity-80">{t('payment_failed_text')}</p></div>
                        <button onClick={() => alert('Redirecting to update payment method...')} className="bg-red-500 text-white font-bold px-5 py-2 rounded-full text-sm hover:bg-red-400 transition-colors flex-shrink-0">{t('update_payment_method')}</button>
                    </div>
                )}
                
                {isInactive ? (
                    <>
                        <PlanSelector onSubscribe={handleSubscribe} isLoading={pageIsLoading} />
                        <div className="mt-12 flex flex-col items-center">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('payment_method')}</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md text-center">{t('secure_payments_info')}</p>
                            <PaymentFlipCard />
                        </div>
                    </>
                ) : (
                    <div className="glass-card-style p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('subscription_status')}</h2>
                            <StatusCard status={subscriptionStatus} expiryDate={subscriptionExpiresAt} />
                        </div>
                        {plan && (
                            <div className="border-t glass-card-divider pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><h3 className="font-bold text-[var(--text-primary)] mb-2">{t('current_plan')}</h3>
                                    <div className="p-4 rounded-lg bg-[var(--background-alt)] border border-[var(--border-color-alt)]">
                                        <p className="font-semibold text-[var(--text-primary)]">{t(plan.nameKey)}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">€{plan.price}/{t(plan.intervalKey)}</p>
                                    </div>
                                </div>
                                <div><h3 className="font-bold text-[var(--text-primary)] mb-2">{t('payment_method')}</h3>
                                    <div className="p-4 rounded-lg bg-[var(--background-alt)] border border-[var(--border-color-alt)] flex items-center gap-3">
                                        <PaymentFlipCard />
                                        <div><p className="font-semibold text-[var(--text-primary)]">Visa **** 4242</p><p className="text-sm text-[var(--text-secondary)]">{t('next_billing_date')}: {subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</p></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="border-t glass-card-divider pt-6 flex flex-col sm:flex-row gap-2">
                            <button onClick={() => alert('Redirecting to Stripe Customer Portal...')} className="btn-secondary flex-1">{t('manage_subscription')}</button>
                            <button onClick={() => setShowCancelModal(true)} className="btn-danger flex-1">{t('cancel_subscription')}</button>
                        </div>
                        <div className="border-t glass-card-divider pt-6">
                            <BillingHistory businessId={business.id} />
                        </div>
                    </div>
                )}

            </div>

            {showCancelModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--background-alt)] rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('cancellation_confirm_title')}</h2>
                        <p className="text-[var(--text-secondary)] my-4">{t('cancellation_confirm_text')}</p>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowCancelModal(false)} className="btn-secondary flex-1">{t('back')}</button>
                            <button onClick={handleCancelSubscription} disabled={pageIsLoading} className="btn-danger flex-1">{pageIsLoading ? t('loading') : t('confirm_cancellation')}</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.btn-secondary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--text-primary); background-color: var(--border-color); border-radius: 9999px; transition: background-color 0.3s; } .btn-secondary:hover { background-color: var(--border-color-alt); } .btn-danger { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: white; background-color: #dc2626; border-radius: 9999px; transition: background-color 0.3s; } .btn-danger:hover { background-color: #b91c1c; }`}</style>
        </div>
    );
};

export default AccountPage;
