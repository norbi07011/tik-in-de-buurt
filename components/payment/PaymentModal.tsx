import React, { useState } from 'react';
import { CreditCardIcon, CurrencyEuroIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import EnhancedPaymentSystem, { PaymentResult } from './EnhancedPaymentSystem';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, any>;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency = 'EUR',
  description,
  customerId,
  metadata,
  onSuccess,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSuccess = (result: PaymentResult) => {
    console.log('✅ Payment completed successfully:', result);
    setIsProcessing(false);
    onSuccess?.(result);
    onClose();
  };

  const handleError = (error: string) => {
    console.error('❌ Payment error:', error);
    setIsProcessing(false);
    onError?.(error);
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      ></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all">
          {/* Close button */}
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close payment modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Payment System */}
          <EnhancedPaymentSystem
            amount={amount}
            currency={currency}
            description={description}
            customerId={customerId}
            metadata={metadata}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

// Demo component for testing payments
interface PaymentDemoProps {
  onOpenPayment: (amount: number, description: string) => void;
}

const PaymentDemo: React.FC<PaymentDemoProps> = ({ onOpenPayment }) => {
  const demoPayments = [
    { amount: 4999, description: 'Basic Plan - yearly' },
    { amount: 9999, description: 'Pro Plan - yearly' },
    { amount: 19999, description: 'Enterprise Plan - yearly' },
    { amount: 4999, description: 'Premium CV Package' },
    { amount: 29999, description: 'Business Premium - yearly' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <CreditCardIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Demo Płatności
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoPayments.map((payment, index) => (
          <button
            key={index}
            onClick={() => onOpenPayment(payment.amount, payment.description)}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="font-medium text-gray-900 dark:text-white">
              {payment.description}
            </div>
            <div className="text-lg font-bold text-blue-600">
              {new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: 'EUR'
              }).format(payment.amount / 100)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Analytics component
interface PaymentAnalyticsProps {
  analytics: any[];
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ analytics }) => {
  const totalAmount = analytics.reduce((sum, item) => sum + (item.amount || 0), 0);
  const successfulPayments = analytics.filter(item => item.status === 'succeeded');
  const successRate = analytics.length > 0 ? (successfulPayments.length / analytics.length) * 100 : 0;

  const methodStats = analytics.reduce((acc, item) => {
    const method = item.method || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <ChartBarIcon className="w-6 h-6 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Analityka Płatności
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
            Łączna wartość
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'EUR'
            }).format(totalAmount / 100)}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
          <div className="text-green-600 dark:text-green-400 text-sm font-medium">
            Wskaźnik sukcesu
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {successRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
          <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">
            Liczba transakcji
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {analytics.length}
          </div>
        </div>
      </div>

      {Object.keys(methodStats).length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Popularne metody płatności
          </h4>
          <div className="space-y-2">
            {Object.entries(methodStats).map(([method, count]) => (
              <div key={method} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {method}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {String(count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { PaymentModal, PaymentDemo, PaymentAnalytics };
export default PaymentModal;