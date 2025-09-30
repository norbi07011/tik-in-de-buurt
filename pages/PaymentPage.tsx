import React, { useState, useEffect } from 'react';
import { CreditCardIcon, ChartBarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import EnhancedPaymentSystem, { PaymentResult } from '../components/payment/EnhancedPaymentSystem';
import { PaymentDemo, PaymentAnalytics } from '../components/payment/PaymentModal';
import { paymentService } from '../services/paymentService';

const PaymentPage: React.FC = () => {
  const [showPaymentSystem, setShowPaymentSystem] = useState(false);
  const [currentPayment, setCurrentPayment] = useState({
    amount: 0,
    description: '',
    currency: 'EUR'
  });
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadRecentPayments();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = paymentService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadRecentPayments = async () => {
    try {
      // Simulate loading recent payments
      const mockPayments = [
        {
          id: 'tx_001',
          amount: 4999,
          currency: 'EUR',
          description: 'Basic Plan - yearly',
          status: 'succeeded',
          method: 'ideal',
          created: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        },
        {
          id: 'tx_002',
          amount: 9999,
          currency: 'EUR',
          description: 'Pro Plan - yearly',
          status: 'succeeded',
          method: 'ideal',
          created: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          id: 'tx_003',
          amount: 19999,
          currency: 'EUR',
          description: 'Enterprise Plan - yearly',
          status: 'pending',
          method: 'bancontact',
          created: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
        }
      ];
      setRecentPayments(mockPayments);
    } catch (error) {
      console.error('Failed to load recent payments:', error);
    }
  };

  const handleOpenPayment = (amount: number, description: string, currency: string = 'EUR') => {
    setCurrentPayment({ amount, description, currency });
    setShowPaymentSystem(true);
  };

  const handlePaymentSuccess = async (result: PaymentResult) => {
    console.log('🎉 Payment completed!', result);
    
    // Show success notification
    alert(`Płatność zakończona pomyślnie!\nID transakcji: ${result.paymentIntent.id}`);
    
    // Reload data
    await loadAnalytics();
    await loadRecentPayments();
    
    // Close payment system
    setShowPaymentSystem(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment failed:', error);
    alert(`Błąd płatności: ${error}`);
  };

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-xs">✕</span>
        </div>;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-400"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Zakończone';
      case 'pending':
        return 'Oczekujące';
      case 'failed':
        return 'Nieudane';
      default:
        return 'Nieznany';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <CreditCardIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                System Płatności
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Zarządzaj płatnościami i monitoruj transakcje
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Payment Demo */}
            <PaymentDemo onOpenPayment={handleOpenPayment} />

            {/* Recent Payments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ostatnie Płatności
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentPayments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    Brak płatności do wyświetlenia
                  </div>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {payment.description}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {payment.id} • {formatDate(payment.created)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatAmount(payment.amount, payment.currency)}
                          </div>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{payment.method}</span>
                        {payment.method === 'stripe' && <span className="ml-1">💳</span>}
                        {payment.method === 'blik' && <span className="ml-1">📱</span>}
                        {payment.method === 'przelewy24' && <span className="ml-1">🏪</span>}
                        {payment.method === 'paypal' && <span className="ml-1">🅿️</span>}
                        {payment.method === 'payu' && <span className="ml-1">💰</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Dostępne Metody Płatności
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Karty płatnicze
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Visa, Mastercard, Amex • 1.4% + €0.25
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📱</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        iDEAL
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Nederlandse banken • 0.29%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🏪</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Bancontact
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Belgische kaarten • 1.2%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🅿️</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        PayPal
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Internationale betalingen • 2.9% + €0.35
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Analytics */}
            <PaymentAnalytics analytics={analytics} />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Szybkie Akcje
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleOpenPayment(9999, 'Test Payment - Pro Plan')}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Test Płatności
                </button>
                
                <button
                  onClick={() => {
                    setAnalytics([]);
                    setRecentPayments([]);
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Wyczyść Dane
                </button>
                
                <button
                  onClick={loadRecentPayments}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Odśwież
                </button>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bezpieczeństwo
                </h3>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Szyfrowanie SSL 256-bit</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Certyfikat PCI DSS</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>3D Secure uwierzytelnianie</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Ochrona przed oszustwami</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentSystem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <EnhancedPaymentSystem
                amount={currentPayment.amount}
                currency={currentPayment.currency}
                description={currentPayment.description}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={() => setShowPaymentSystem(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;