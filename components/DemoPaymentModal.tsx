import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, XMarkIcon, CreditCardIcon } from './icons/Icons';

interface DemoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onSuccess: () => void;
}

interface DemoSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

const DemoPaymentModal: React.FC<DemoPaymentModalProps> = ({
  isOpen,
  onClose,
  businessId,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<DemoSubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DemoSubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [step, setStep] = useState<'select' | 'payment' | 'processing' | 'success'>('select');
  const [simulateType, setSimulateType] = useState<'success' | 'decline' | 'network_error'>('success');

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/demo-payments/plans');
      const result = await response.json();
      
      if (result.success) {
        setPlans(result.data);
      } else {
        setError('Failed to load plans');
      }
    } catch (error) {
      setError('Failed to load payment options');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: DemoSubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('payment');
    setError('');
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    try {
      setStep('processing');
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/demo-payments/simulate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          businessId: businessId,
          simulate: simulateType
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Payment successful! Your ${selectedPlan.name} subscription is now active.`);
        setStep('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        setError(result.error || 'Payment failed');
        setStep('payment');
      }
    } catch (error) {
      setError('Payment processing failed');
      setStep('payment');
    }
  };

  const resetModal = () => {
    setStep('select');
    setSelectedPlan(null);
    setError('');
    setSuccess('');
    setSimulateType('success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--card-bg)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {step === 'select' && (t('choose_plan') || 'Choose Plan')}
              {step === 'payment' && (t('payment') || 'Payment')}
              {step === 'processing' && (t('processing') || 'Processing...')}
              {step === 'success' && (t('success') || 'Success!')}
            </h2>
            <button
              onClick={() => { onClose(); resetModal(); }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
              title="Zamknij"
              aria-label="Zamknij modal płatności"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Demo Warning */}
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <span className="text-sm font-medium">Demo Mode - No real payments</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
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
                    selectedPlan?.id === plan.id
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
          ) : step === 'payment' ? (
            <div className="space-y-6">
              {selectedPlan && (
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    {selectedPlan.name} Plan
                  </h3>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    €{selectedPlan.price}
                    <span className="text-sm text-[var(--text-secondary)]">/{selectedPlan.interval}</span>
                  </p>
                </div>
              )}

              {/* Demo Payment Simulation Options */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Demo Payment Simulation:</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="simulation"
                      value="success"
                      checked={simulateType === 'success'}
                      onChange={() => setSimulateType('success')}
                      className="mr-2"
                    />
                    <span className="text-sm text-green-600">✅ Successful Payment</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="simulation"
                      value="decline"
                      checked={simulateType === 'decline'}
                      onChange={() => setSimulateType('decline')}
                      className="mr-2"
                    />
                    <span className="text-sm text-red-600">❌ Card Declined</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="simulation"
                      value="network_error"
                      checked={simulateType === 'network_error'}
                      onChange={() => setSimulateType('network_error')}
                      className="mr-2"
                    />
                    <span className="text-sm text-orange-600">🌐 Network Error</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
              >
                <CreditCardIcon className="w-5 h-5" />
                {t('simulate_payment') || `Simulate Payment €${selectedPlan?.price}`}
              </button>

              <button
                onClick={() => setStep('select')}
                className="w-full text-blue-600 hover:text-blue-700 text-sm"
              >
                ← {t('back_to_plans') || 'Back to Plans'}
              </button>
            </div>
          ) : step === 'processing' ? (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[var(--text-primary)] font-medium">Processing payment...</p>
              <p className="text-[var(--text-secondary)] text-sm mt-2">Please wait...</p>
            </div>
          ) : step === 'success' ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Payment Successful!</h3>
              <p className="text-[var(--text-secondary)]">Your subscription is now active.</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Redirecting...</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DemoPaymentModal;