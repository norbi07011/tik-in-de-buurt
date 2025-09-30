import React, { useState, useEffect } from 'react';
import { CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';

export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'paypal' | 'ideal' | 'bancontact' | 'sofort';
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  fees: {
    percentage: number;
    fixed: number; // in cents
  };
  processingTime: string;
  description: string;
  currencies: string[];
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  method?: string;
  created: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent: PaymentIntent;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
  transactionId?: string;
}

interface EnhancedPaymentSystemProps {
  amount: number;
  currency?: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, any>;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

const EnhancedPaymentSystem: React.FC<EnhancedPaymentSystemProps> = ({
  amount,
  currency = 'EUR',
  description,
  customerId,
  metadata,
  onSuccess,
  onError,
  onCancel
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'details' | 'processing' | 'complete'>('select');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      postal: '',
      country: 'PL'
    }
  });
  const [blikCode, setBlikCode] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      type: 'stripe',
      name: 'Credit Card',
      icon: <CreditCardIcon className="w-6 h-6" />,
      enabled: true,
      fees: { percentage: 1.4, fixed: 25 },
      processingTime: 'Instant',
      description: 'Visa, Mastercard, American Express',
      currencies: ['EUR', 'USD', 'GBP']
    },
    {
      id: 'ideal',
      type: 'ideal',
      name: 'iDEAL',
      icon: <DevicePhoneMobileIcon className="w-6 h-6" />,
      enabled: true,
      fees: { percentage: 0.29, fixed: 0 },
      processingTime: 'Instant',
      description: 'Dutch online banking',
      currencies: ['EUR']
    },
    {
      id: 'bancontact',
      type: 'bancontact',
      name: 'Bancontact',
      icon: <BanknotesIcon className="w-6 h-6" />,
      enabled: true,
      fees: { percentage: 1.2, fixed: 0 },
      processingTime: '1-2 business days',
      description: 'Belgian bank cards',
      currencies: ['EUR']
    },
    {
      id: 'paypal',
      type: 'paypal',
      name: 'PayPal',
      icon: <CurrencyEuroIcon className="w-6 h-6" />,
      enabled: true,
      fees: { percentage: 2.9, fixed: 35 },
      processingTime: 'Instant',
      description: 'PayPal or card payment',
      currencies: ['EUR', 'USD', 'GBP']
    },
    {
      id: 'sofort',
      type: 'sofort',
      name: 'SOFORT',
      icon: <BanknotesIcon className="w-6 h-6" />,
      enabled: true,
      fees: { percentage: 1.5, fixed: 0 },
      processingTime: 'Instant',
      description: 'German online banking',
      currencies: ['EUR']
    }
  ];

  const availableMethods = paymentMethods.filter(method => 
    method.enabled && method.currencies.includes(currency)
  );

  const calculateFees = (method: PaymentMethod, amount: number): number => {
    return Math.round((amount * method.fees.percentage / 100) + method.fees.fixed);
  };

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setPaymentStep('details');
  };

  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19;
  };

  const validateExpiry = (expiry: string): boolean => {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    
    const month = parseInt(match[1]);
    const year = parseInt(match[2]) + 2000;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    return month >= 1 && month <= 12 && 
           (year > currentYear || (year === currentYear && month >= currentMonth));
  };

  const validateCVC = (cvc: string): boolean => {
    return /^\d{3,4}$/.test(cvc);
  };

  const validateBlikCode = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  const handleCardInput = (field: string, value: string) => {
    if (field === 'number') {
      // Format card number with spaces
      const formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
      setCardDetails(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'expiry') {
      // Format MM/YY
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
      setCardDetails(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'cvc') {
      // Only numbers, max 4 digits
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setCardDetails(prev => ({ ...prev, [field]: formatted }));
    } else {
      setCardDetails(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddressInput = (field: string, value: string) => {
    setCardDetails(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const processPayment = async () => {
    if (!selectedMethod || !agreedToTerms) return;

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      const method = paymentMethods.find(m => m.id === selectedMethod);
      if (!method) throw new Error('Invalid payment method');

      // Validation based on method
      if (method.type === 'stripe') {
        if (!validateCardNumber(cardDetails.number) || 
            !validateExpiry(cardDetails.expiry) || 
            !validateCVC(cardDetails.cvc) ||
            !cardDetails.name.trim() ||
            !cardDetails.email.trim()) {
          throw new Error('Please fill in all required card fields');
        }
      } else if (method.type === 'ideal') {
        // For iDEAL, no additional validation needed beyond bank selection
      }

      // Create payment intent
      const paymentData = {
        amount,
        currency,
        description,
        method: selectedMethod,
        customerId,
        metadata: {
          ...metadata,
          saveCard: saveCard.toString()
        },
        // Add method-specific data
        ...(method.type === 'stripe' && {
          card: {
            number: cardDetails.number.replace(/\s/g, ''),
            expiry: cardDetails.expiry,
            cvc: cardDetails.cvc,
            name: cardDetails.name,
            email: cardDetails.email,
            address: cardDetails.address
          }
        }),
        ...(method.type === 'ideal' && {
          ideal: { bankCode: 'ABNANL2A' } // Default bank, this should be selected by user
        })
      };

      console.log('🔄 Processing payment...', { method: selectedMethod, amount });

      // Simulate API call
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }

      const result: PaymentResult = await response.json();

      if (result.success) {
        console.log('✅ Payment successful!', result);
        setPaymentStep('complete');
        setTimeout(() => onSuccess(result), 1500);
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Błąd płatności';
      onError(errorMessage);
      setPaymentStep('details');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
  const fees = selectedMethodData ? calculateFees(selectedMethodData, amount) : 0;
  const totalAmount = amount + fees;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold">Bezpieczna płatność</h2>
        <div className="mt-2">
          <div className="text-3xl font-bold">{formatAmount(amount, currency)}</div>
          <div className="text-blue-100">{description}</div>
        </div>
      </div>

      {/* Payment Steps */}
      <div className="p-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            paymentStep === 'select' ? 'bg-blue-600 text-white' : 
            ['details', 'processing', 'complete'].includes(paymentStep) ? 'bg-green-500 text-white' : 
            'bg-gray-300 text-gray-600'
          }`}>1</div>
          <div className={`h-1 w-12 mx-2 ${
            ['details', 'processing', 'complete'].includes(paymentStep) ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            paymentStep === 'details' ? 'bg-blue-600 text-white' : 
            ['processing', 'complete'].includes(paymentStep) ? 'bg-green-500 text-white' : 
            'bg-gray-300 text-gray-600'
          }`}>2</div>
          <div className={`h-1 w-12 mx-2 ${
            ['processing', 'complete'].includes(paymentStep) ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            paymentStep === 'processing' ? 'bg-blue-600 text-white' : 
            paymentStep === 'complete' ? 'bg-green-500 text-white' : 
            'bg-gray-300 text-gray-600'
          }`}>3</div>
        </div>

        {/* Step 1: Method Selection */}
        {paymentStep === 'select' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Wybierz metodę płatności
            </h3>
            <div className="space-y-3">
              {availableMethods.map((method) => {
                const methodFees = calculateFees(method, amount);
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">{method.icon}</div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {method.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatAmount(methodFees, currency)} opłata
                        </div>
                        <div className="text-xs text-gray-500">
                          {method.processingTime}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {paymentStep === 'details' && selectedMethodData && (
          <div>
            <button
              onClick={() => setPaymentStep('select')}
              className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
            >
              ← Zmień metodę płatności
            </button>

            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Szczegóły płatności - {selectedMethodData.name}
            </h3>

            {/* Card Payment Form */}
            {selectedMethodData.type === 'stripe' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Numer karty
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={(e) => handleCardInput('number', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        MM/RR
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(e) => handleCardInput('expiry', e.target.value)}
                        placeholder="12/25"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvc}
                        onChange={(e) => handleCardInput('cvc', e.target.value)}
                        placeholder="123"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Imię i nazwisko posiadacza karty
                  </label>
                  <input
                    type="text"
                    value={cardDetails.name}
                    onChange={(e) => handleCardInput('name', e.target.value)}
                    placeholder="Jan Kowalski"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={cardDetails.email}
                    onChange={(e) => handleCardInput('email', e.target.value)}
                    placeholder="jan.kowalski@example.com"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="saveCard" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Zapisz kartę dla przyszłych płatności
                  </label>
                </div>
              </div>
            )}

            {/* iDEAL Bank Selection */}
            {selectedMethodData.type === 'ideal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select your bank
                </label>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  You will be redirected to your bank's website to complete the payment
                </p>
              </div>
            )}

            {/* Other methods info */}
            {!['stripe', 'ideal'].includes(selectedMethodData.type) && (
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200">
                  Po kliknięciu "Zapłać" zostaniesz przekierowany do {selectedMethodData.name} 
                  w celu dokończenia płatności.
                </p>
              </div>
            )}

            {/* Terms and Total */}
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Kwota:</span>
                  <span>{formatAmount(amount, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Opłata za płatność:</span>
                  <span>{formatAmount(fees, currency)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Łącznie:</span>
                    <span>{formatAmount(totalAmount, currency)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Akceptuję <a href="#" className="text-blue-600 hover:underline">regulamin</a> i 
                  <a href="#" className="text-blue-600 hover:underline ml-1">politykę prywatności</a>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onCancel?.()}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={processPayment}
                  disabled={!agreedToTerms || isProcessing}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Przetwarzanie...' : `Zapłać ${formatAmount(totalAmount, currency)}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {paymentStep === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Przetwarzanie płatności...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Nie zamykaj tej strony. Płatność jest w trakcie realizacji.
            </p>
          </div>
        )}

        {/* Step 4: Complete */}
        {paymentStep === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Płatność zakończona pomyślnie!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Dziękujemy za płatność. Szczegóły zostały wysłane na email.
            </p>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
        <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Twoje dane są zabezpieczone szyfrowaniem SSL 256-bit
        </div>
      </div>
    </div>
  );
};

export default EnhancedPaymentSystem;