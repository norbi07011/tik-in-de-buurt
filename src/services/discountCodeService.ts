interface DiscountCode {
  code: string;
  type: 'percentage' | 'free_year' | 'free_lifetime';
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  finalPrice?: number;
  freeMonths?: number | null;
}

interface DiscountValidationResponse {
  valid: boolean;
  error?: string;
  code?: string;
  type?: string;
  description?: string;
  discountPercent?: number;
}

interface DiscountApplicationResponse {
  code: string;
  description: string;
  originalPrice: number;
  type: 'percentage' | 'free_year' | 'free_lifetime';
  discountPercent?: number;
  discountAmount: number;
  finalPrice: number;
  freeMonths?: number | null;
}

class DiscountCodeService {
  private apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  /**
   * Validate discount code for specific plan
   */
  async validateCode(code: string, planId: string): Promise<DiscountValidationResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/discount-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, planId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { valid: false, error: data.error || 'Invalid code' };
      }

      return data;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return { valid: false, error: 'Network error' };
    }
  }

  /**
   * Apply discount code to get calculated price
   */
  async applyCode(code: string, planId: string, originalPrice: number): Promise<DiscountApplicationResponse | { error: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/discount-codes/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, planId, originalPrice }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.error || 'Failed to apply code' };
      }

      return data;
    } catch (error) {
      console.error('Error applying discount code:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Mark discount code as used (called after successful payment)
   */
  async markAsUsed(
    code: string, 
    businessId: string, 
    originalPrice: number, 
    discountApplied: number, 
    finalPrice: number,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/discount-codes/mark-used`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          code, 
          businessId, 
          originalPrice, 
          discountApplied, 
          finalPrice 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to mark code as used' };
      }

      return data;
    } catch (error) {
      console.error('Error marking discount code as used:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get predefined discount codes for demo/examples
   */
  getPredefinedCodes(): { code: string; description: string; type: string }[] {
    return [
      { code: 'WELCOME20', description: '20% off first subscription', type: 'percentage' },
      { code: 'PROMO50', description: '50% off any plan', type: 'percentage' },
      { code: 'STUDENT30', description: '30% student discount', type: 'percentage' },
      { code: 'BUSINESS25', description: '25% business discount', type: 'percentage' },
    ];
  }

  /**
   * Format price with EUR currency
   */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Calculate savings display
   */
  calculateSavings(originalPrice: number, finalPrice: number): {
    savingsAmount: number;
    savingsPercent: number;
    formattedSavings: string;
  } {
    const savingsAmount = originalPrice - finalPrice;
    const savingsPercent = Math.round((savingsAmount / originalPrice) * 100);
    const formattedSavings = this.formatPrice(savingsAmount);

    return {
      savingsAmount,
      savingsPercent,
      formattedSavings,
    };
  }

  /**
   * Get discount badge text
   */
  getDiscountBadge(discountCode: DiscountCode): string {
    switch (discountCode.type) {
      case 'percentage':
        return `${discountCode.discountPercent}% OFF`;
      case 'free_year':
        return 'FREE YEAR';
      case 'free_lifetime':
        return 'LIFETIME FREE';
      default:
        return 'DISCOUNT';
    }
  }

  /**
   * Get discount description with benefits
   */
  getDiscountDescription(discountCode: DiscountCode, originalPrice: number): string {
    switch (discountCode.type) {
      case 'percentage':
        const savings = this.calculateSavings(originalPrice, discountCode.finalPrice || originalPrice);
        return `Save ${savings.formattedSavings} (${discountCode.discountPercent}% off)`;
      case 'free_year':
        return `Free subscription for 1 year (worth ${this.formatPrice(originalPrice)})`;
      case 'free_lifetime':
        return 'Lifetime free subscription - no recurring charges!';
      default:
        return discountCode.description;
    }
  }
}

export const discountCodeService = new DiscountCodeService();
export default discountCodeService;
export type { DiscountCode, DiscountValidationResponse, DiscountApplicationResponse };