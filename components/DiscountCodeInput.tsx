import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, PercentIcon, Gift, Crown, Loader2 } from 'lucide-react';
import { discountCodeService, DiscountApplicationResponse } from '../src/services/discountCodeService';

interface DiscountCodeInputProps {
  planId: string;
  originalPrice: number;
  onDiscountApplied: (discountData: DiscountApplicationResponse | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function DiscountCodeInput({ 
  planId, 
  originalPrice, 
  onDiscountApplied, 
  disabled = false,
  className = '' 
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    discountData?: DiscountApplicationResponse;
  } | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountApplicationResponse | null>(null);

  // Clear validation when code changes
  useEffect(() => {
    if (code.length === 0) {
      setValidationResult(null);
      setAppliedDiscount(null);
      onDiscountApplied(null);
    }
  }, [code, onDiscountApplied]);

  const validateAndApplyCode = async () => {
    if (!code.trim() || code.length < 3) {
      setValidationResult({
        valid: false,
        message: 'Please enter a valid discount code',
        type: 'error'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // First validate the code
      const validation = await discountCodeService.validateCode(code.trim().toUpperCase(), planId);
      
      if (!validation.valid) {
        setValidationResult({
          valid: false,
          message: validation.error || 'Invalid discount code',
          type: 'error'
        });
        setIsValidating(false);
        return;
      }

      // Then apply the code to get calculated prices
      const application = await discountCodeService.applyCode(code.trim().toUpperCase(), planId, originalPrice);
      
      if ('error' in application) {
        setValidationResult({
          valid: false,
          message: application.error,
          type: 'error'
        });
        setIsValidating(false);
        return;
      }

      // Success - set applied discount
      setAppliedDiscount(application);
      onDiscountApplied(application);
      
      let successMessage = `Code "${application.code}" applied successfully!`;
      if (application.type === 'percentage') {
        successMessage += ` You save ${discountCodeService.formatPrice(application.discountAmount)}`;
      } else if (application.type === 'free_year') {
        successMessage += ` Free for 1 year!`;
      } else if (application.type === 'free_lifetime') {
        successMessage += ` Lifetime free access!`;
      }

      setValidationResult({
        valid: true,
        message: successMessage,
        type: 'success',
        discountData: application
      });

    } catch (error) {
      console.error('Error applying discount code:', error);
      setValidationResult({
        valid: false,
        message: 'Failed to apply discount code. Please try again.',
        type: 'error'
      });
    }

    setIsValidating(false);
  };

  const removeDiscount = () => {
    setCode('');
    setValidationResult(null);
    setAppliedDiscount(null);
    onDiscountApplied(null);
  };

  const getDiscountIcon = (type?: string) => {
    switch (type) {
      case 'percentage':
        return <PercentIcon className="w-4 h-4" />;
      case 'free_year':
        return <Gift className="w-4 h-4" />;
      case 'free_lifetime':
        return <Crown className="w-4 h-4" />;
      default:
        return <PercentIcon className="w-4 h-4" />;
    }
  };

  const getDiscountBadgeColor = (type?: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'free_year':
        return 'bg-green-100 text-green-800';
      case 'free_lifetime':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Discount Code Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter discount code"
              disabled={disabled || isValidating || !!appliedDiscount}
              className={`
                w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:bg-gray-50 disabled:text-gray-500
                ${appliedDiscount ? 'bg-green-50 border-green-300' : ''}
                transition-colors duration-200
              `}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !disabled && !isValidating && !appliedDiscount) {
                  validateAndApplyCode();
                }
              }}
            />
            {appliedDiscount && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          
          {!appliedDiscount ? (
            <button
              onClick={validateAndApplyCode}
              disabled={disabled || isValidating || !code.trim() || code.length < 3}
              className={`
                px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
                hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors duration-200 min-w-[100px]
              `}
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Apply'
              )}
            </button>
          ) : (
            <button
              onClick={removeDiscount}
              disabled={disabled}
              className={`
                px-6 py-3 bg-gray-500 text-white font-medium rounded-lg
                hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors duration-200 min-w-[100px]
              `}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className={`
          flex items-start gap-3 p-4 rounded-lg border
          ${validationResult.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }
        `}>
          {validationResult.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">{validationResult.message}</p>
            {validationResult.discountData && (
              <p className="text-sm mt-1 opacity-90">
                {validationResult.discountData.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Applied Discount Summary */}
      {appliedDiscount && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getDiscountIcon(appliedDiscount.type)}
              <span className="font-semibold text-green-800">Discount Applied</span>
            </div>
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${getDiscountBadgeColor(appliedDiscount.type)}
            `}>
              {discountCodeService.getDiscountBadge({
                ...appliedDiscount,
                discountPercent: appliedDiscount.discountPercent || 0
              })}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Price:</span>
              <span className="line-through text-gray-500">
                {discountCodeService.formatPrice(appliedDiscount.originalPrice)}
              </span>
            </div>
            
            {appliedDiscount.type === 'percentage' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount ({appliedDiscount.discountPercent}%):</span>
                <span className="text-green-600 font-medium">
                  -{discountCodeService.formatPrice(appliedDiscount.discountAmount)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span className="text-gray-800">Final Price:</span>
              <span className="text-green-600">
                {appliedDiscount.type === 'free_lifetime' || appliedDiscount.type === 'free_year' 
                  ? 'FREE' 
                  : discountCodeService.formatPrice(appliedDiscount.finalPrice)
                }
              </span>
            </div>
            
            {appliedDiscount.freeMonths && (
              <div className="text-center text-green-700 font-medium bg-green-100 rounded px-3 py-2 mt-2">
                🎉 {appliedDiscount.freeMonths === 12 ? 'Free for 1 year' : `Free for ${appliedDiscount.freeMonths} months`}!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Predefined Codes Hint */}
      {!appliedDiscount && !validationResult && (
        <div className="text-xs text-gray-500">
          <p>Have a discount code? Enter it above to save on your subscription.</p>
        </div>
      )}
    </div>
  );
}