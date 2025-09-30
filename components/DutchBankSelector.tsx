import React, { useState } from 'react';
import { Building2, Check, CreditCard } from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  icon: string;
}

interface DutchBankSelectorProps {
  selectedBank?: string;
  onBankSelect: (bankId: string) => void;
  disabled?: boolean;
  className?: string;
}

const DUTCH_BANKS: Bank[] = [
  { id: 'ABNANL2A', name: 'ABN AMRO', icon: '🟢' },
  { id: 'INGBNL2A', name: 'ING Bank', icon: '🧡' },
  { id: 'RABONL2U', name: 'Rabobank', icon: '🔵' },
  { id: 'SNSBNL2A', name: 'SNS Bank', icon: '💜' },
  { id: 'ASNBNL21', name: 'ASN Bank', icon: '🌱' },
  { id: 'BUNQNL2A', name: 'Bunq', icon: '🌈' },
  { id: 'KNABNL2H', name: 'Knab', icon: '⚡' },
  { id: 'REVOLT21', name: 'Revolut', icon: '🔄' },
  { id: 'NTSBDEB1', name: 'N26', icon: '🎯' }
];

const DutchBankSelector: React.FC<DutchBankSelectorProps> = ({
  selectedBank,
  onBankSelect,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleBankSelect = (bankId: string) => {
    onBankSelect(bankId);
    setIsOpen(false);
  };

  const selectedBankData = DUTCH_BANKS.find(bank => bank.id === selectedBank);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Building2 className="w-4 h-4 inline mr-1" />
        Selecteer uw bank
      </label>
      
      {/* Selected Bank Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full p-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer'}
          ${selectedBank ? 'text-gray-900' : 'text-gray-500'}
        `}
      >
        <div className="flex items-center">
          {selectedBankData ? (
            <>
              <span className="text-2xl mr-3">{selectedBankData.icon}</span>
              <span className="font-medium">{selectedBankData.name}</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-3 text-gray-400" />
              <span>Kies uw bank...</span>
            </>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Bank Options Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {DUTCH_BANKS.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => handleBankSelect(bank.id)}
              className={`
                w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg
                ${selectedBank === bank.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
              `}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{bank.icon}</span>
                <span className="font-medium">{bank.name}</span>
              </div>
              {selectedBank === bank.id && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DutchBankSelector;