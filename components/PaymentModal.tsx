import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripeService, { SubscriptionPlan } from '../src/services/stripeService';
import { CheckCircleIcon, XMarkIcon, CreditCardIcon } from './icons/Icons';

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
  onSuccess: () => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  clientSecret, 
  businessId, 
  plan, 
  onSuccess, 
  onError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
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
        onSuccess();
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
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
          {plan.name} Plan
        </h3>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          €{plan.price}
          <span className="text-sm text-[var(--text-secondary)]">/{plan.interval}</span>
        </p>
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
        <PaymentElement />
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
          `${t('pay_now') || 'Pay Now'} €${plan.price}`
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

  const initiatePayment = async (plan: SubscriptionPlan) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await stripeService.createPaymentIntent(plan.id, businessId);
      
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
    initiatePayment(plan);
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
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      €{plan.price}
                      <span className="text-sm text-[var(--text-secondary)]">/{plan.interval}</span>
                    </span>
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
              <Elements 
                stripe={stripeInstance} 
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe'
                  }
                }}
              >
                <CheckoutForm
                  clientSecret={clientSecret}
                  businessId={businessId}
                  plan={currentPlan}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
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