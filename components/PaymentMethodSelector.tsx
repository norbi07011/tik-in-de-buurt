import React, { useState, useEffect } from 'react';
import { CreditCard, Building2, Banknote, Euro, Check } from 'lucide-react';
import DutchBankSelector from './DutchBankSelector';

interface PaymentMethod {
  id: string;
  name: string;
  fees: {
    percentage: number;
    fixed: number;
  };
  currencies: string[];
  enabled: boolean;
  icon?: string;
  description?: string;
  banks?: Array<{ id: string; name: string; icon: string }>;
}

interface PaymentMethodSelectorProps {
  selectedMethod?: string;
  onMethodSelect: (methodId: string, additionalData?: any) => void;
  amount: number;
  currency: string;
  disabled?: boolean;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodSelect,
  amount,
  currency = 'EUR',
  disabled = false,
  className = ''
}) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [iban, setIban] = useState<string>('');

  useEffect(() => {
    fetchPaymentMethods();
  }, [currency]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/payments/methods?currency=${currency}`);
      const data = await response.json();
      
      if (data.success) {
        setMethods(data.methods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = (method: PaymentMethod): number => {
    return Math.round((amount * method.fees.percentage / 100) + method.fees.fixed);
  };

  const formatFee = (fee: number): string => {
    return `€${(fee / 100).toFixed(2)}`;
  };

  const handleMethodSelect = (methodId: string) => {
    let additionalData: any = {};

    if (methodId === 'ideal' && selectedBank) {
      additionalData.bank = selectedBank;
    } else if (methodId === 'sepa' && iban) {
      additionalData.iban = iban;
    }

    onMethodSelect(methodId, additionalData);
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.id) {
      case 'stripe':
        return <CreditCard className="w-6 h-6" />;
      case 'ideal':
        return <Building2 className="w-6 h-6" />;
      case 'bancontact':
        return <span className="text-2xl">🇧🇪</span>;
      case 'sofort':
        return <span className="text-2xl">⚡</span>;
      case 'paypal':
        return <span className="text-2xl">💙</span>;
      case 'sepa':
        return <Banknote className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Euro className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Betaalmethode kiezen</h3>
      </div>

      <div className="space-y-3">
        {methods.map((method) => {
          const fee = calculateFee(method);
          const isSelected = selectedMethod === method.id;
          
          return (
            <div key={method.id} className="space-y-3">
              <button
                type="button"
                onClick={() => handleMethodSelect(method.id)}
                disabled={disabled || !method.enabled}
                className={`
                  w-full p-4 border rounded-lg text-left transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }
                  ${disabled || !method.enabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getMethodIcon(method)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {method.name}
                      </div>
                      {method.description && (
                        <div className="text-sm text-gray-500">
                          {method.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Kosten: {formatFee(fee)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {method.fees.percentage}% + €{(method.fees.fixed / 100).toFixed(2)}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </button>

              {/* Bank Selection for iDEAL */}
              {isSelected && method.id === 'ideal' && (
                <div className="ml-4 p-4 bg-gray-50 rounded-lg">
                  <DutchBankSelector
                    selectedBank={selectedBank}
                    onBankSelect={(bankId) => {
                      setSelectedBank(bankId);
                      onMethodSelect(method.id, { bank: bankId });
                    }}
                    disabled={disabled}
                  />
                </div>
              )}

              {/* IBAN Input for SEPA */}
              {isSelected && method.id === 'sepa' && (
                <div className="ml-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN Nummer
                  </label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/\s/g, '');
                      setIban(value);
                      if (value.length >= 15) {
                        onMethodSelect(method.id, { iban: value });
                      }
                    }}
                    placeholder="NL91 ABNA 0417 1643 00"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={34}
                    disabled={disabled}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Voer uw IBAN nummer in (zonder spaties)
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedMethod && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <Check className="w-4 h-4 mr-2" />
            Betaalmethode geselecteerd: {methods.find(m => m.id === selectedMethod)?.name}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;