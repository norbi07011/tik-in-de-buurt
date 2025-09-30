import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Building2, CreditCard, Banknote } from 'lucide-react';
import stripeService, { SubscriptionPlan } from '../src/services/stripeService';
import { CheckCircleIcon, XMarkIcon, CreditCardIcon, Euro, Tag } from './icons/Icons';
import DiscountCodeInput from './DiscountCodeInput';
import DutchBankSelector from './DutchBankSelector';
import PaymentMethodSelector from './PaymentMethodSelector';
import { discountCodeService, DiscountApplicationResponse } from '../src/services/discountCodeService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  selectedPlan?: SubscriptionPlan;
  onSuccess: () => void;
}

interface CheckoutFormProps {
  clientSecret: string;
  businessId: string;
  plan: SubscriptionPlan;
  appliedDiscount: DiscountApplicationResponse | null;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  clientSecret, 
  businessId, 
  plan, 
  appliedDiscount,
  onSuccess, 
  onError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const finalPrice = appliedDiscount ? appliedDiscount.finalPrice : plan.price;
  const isFree = appliedDiscount && (appliedDiscount.type === 'free_year' || appliedDiscount.type === 'free_lifetime');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // If it's a free subscription, handle differently
      if (isFree) {
        // Call backend to activate free subscription
        const token = localStorage.getItem('authToken') || '';
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payments/activate-free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessId,
            planId: plan.id,
            discountCode: appliedDiscount.code,
            freeMonths: appliedDiscount.freeMonths,
          }),
        });

        if (response.ok) {
          // Mark discount as used
          if (appliedDiscount) {
            await discountCodeService.markAsUsed(
              appliedDiscount.code,
              businessId,
              appliedDiscount.originalPrice,
              appliedDiscount.discountAmount,
              appliedDiscount.finalPrice,
              token
            );
          }
          onSuccess();
        } else {
          const errorData = await response.json();
          onError(errorData.error || 'Failed to activate free subscription');
        }
      } else {
        // Regular payment flow
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/subscription-success`,
          },
          redirect: 'if_required',
        });

        if (error) {
          onError(error.message || 'Payment failed');
        } else {
          // Mark discount as used after successful payment
          if (appliedDiscount) {
            const token = localStorage.getItem('authToken') || '';
            await discountCodeService.markAsUsed(
              appliedDiscount.code,
              businessId,
              appliedDiscount.originalPrice,
              appliedDiscount.discountAmount,
              appliedDiscount.finalPrice,
              token
            );
          }
          onSuccess();
        }
      }
    } catch (err) {
      onError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[var(--text-primary)]">
            {plan.name} Plan
          </h3>
          <Euro className="w-5 h-5 text-blue-600" />
        </div>
        
        {/* Pricing Display */}
        <div className="space-y-2">
          {appliedDiscount ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-500 line-through">
                  {discountCodeService.formatPrice(plan.price)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  appliedDiscount.type === 'percentage' ? 'bg-blue-100 text-blue-800' :
                  appliedDiscount.type === 'free_year' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {appliedDiscount.type === 'percentage' ? `${appliedDiscount.discountPercent}% OFF` :
                   appliedDiscount.type === 'free_year' ? 'FREE YEAR' : 'LIFETIME FREE'}
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {isFree ? 'FREE' : discountCodeService.formatPrice(finalPrice)}
                {!isFree && <span className="text-sm text-[var(--text-secondary)]">/{plan.interval}</span>}
              </p>
              {appliedDiscount.freeMonths && (
                <p className="text-sm text-green-600 font-medium">
                  Free for {appliedDiscount.freeMonths === 12 ? '1 year' : `${appliedDiscount.freeMonths} months`}!
                </p>
              )}
            </div>
          ) : (
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {discountCodeService.formatPrice(plan.price)}
              <span className="text-sm text-[var(--text-secondary)]">/{plan.interval}</span>
            </p>
          )}
        </div>

        <ul className="mt-3 space-y-1">
          {plan.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="text-sm text-[var(--text-secondary)] flex items-center">
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
          {plan.features.length > 3 && (
            <li className="text-sm text-[var(--text-secondary)]">
              +{plan.features.length - 3} more features
            </li>
          )}
        </ul>
      </div>

      <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border)]">
        {!isFree && <PaymentElement />}
        {isFree && (
          <div className="text-center py-4">
            <Tag className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-medium">No payment required!</p>
            <p className="text-sm text-gray-600">Your free subscription will be activated.</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            {t('processing_payment') || 'Processing Payment...'}
          </span>
        ) : (
          `${t('pay_now') || 'Pay Now'} ${isFree ? '' : discountCodeService.formatPrice(finalPrice)}`
        )}
      </button>
    </form>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  businessId,
  selectedPlan,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(selectedPlan || null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountApplicationResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPlan) {
      setCurrentPlan(selectedPlan);
      setStep('payment');
      initiatePayment(selectedPlan);
    }
  }, [selectedPlan]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, stripe] = await Promise.all([
        stripeService.getPlans(),
        stripeService.getStripeInstance()
      ]);
      setPlans(plansData);
      setStripeInstance(stripe);
    } catch (error) {
      setError('Failed to load payment options');
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayment = async (plan: SubscriptionPlan, discount?: DiscountApplicationResponse) => {
    try {
      setIsLoading(true);
      setError('');

      // If discount is free, we don't need Stripe payment intent
      if (discount && (discount.type === 'free_year' || discount.type === 'free_lifetime')) {
        setClientSecret('free_subscription');
        setStep('payment');
        return;
      }

      const finalPrice = discount ? discount.finalPrice : plan.price;
      const response = await stripeService.createPaymentIntent(plan.id, businessId, finalPrice);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create payment');
      }

      setClientSecret(response.data.clientSecret);
      setStep('payment');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    // Reset discount when changing plans
    setAppliedDiscount(null);
    initiatePayment(plan);
  };

  const handleDiscountApplied = (discountData: DiscountApplicationResponse | null) => {
    setAppliedDiscount(discountData);
    if (currentPlan) {
      // Re-initiate payment with new pricing
      initiatePayment(currentPlan, discountData || undefined);
    }
  };

  const handlePaymentSuccess = () => {
    onSuccess();
    onClose();
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--card-bg)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {step === 'select' ? (t('choose_plan') || 'Choose Plan') : (t('payment') || 'Payment')}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
              title="Zamknij"
              aria-label="Zamknij modal płatności"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : step === 'select' ? (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    currentPlan?.id === plan.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-[var(--border)] hover:border-blue-300'
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[var(--text-primary)]">
                        {discountCodeService.formatPrice(plan.price)}
                        <span className="text-sm text-[var(--text-secondary)]">/{plan.interval}</span>
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="text-sm text-[var(--text-secondary)] flex items-center">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-sm text-blue-600 font-medium">
                        +{plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            clientSecret && currentPlan && stripeInstance && (
              <div className="space-y-6">
                {/* Discount Code Input */}
                <DiscountCodeInput
                  planId={currentPlan.id}
                  originalPrice={currentPlan.price}
                  onDiscountApplied={handleDiscountApplied}
                  disabled={isLoading}
                />
                
                {/* Dutch Payment Method Selector */}
                <PaymentMethodSelector
                  amount={appliedDiscount ? appliedDiscount.finalPrice : currentPlan.price}
                  currency="EUR"
                  onMethodSelect={(methodId: string, additionalData?: any) => {
                    console.log('Selected payment method:', methodId, additionalData);
                    setIsLoading(true);
                    // Simulate payment processing for demo
                    setTimeout(() => {
                      setIsLoading(false);
                      handlePaymentSuccess();
                    }, 2000);
                  }}
                  disabled={isLoading}
                />
              </div>
            )
          )}

          {step === 'payment' && (
            <button
              onClick={() => setStep('select')}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
            >
              ← {t('back_to_plans') || 'Back to Plans'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;