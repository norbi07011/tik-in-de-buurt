// Dutch Payment Service - EUR focused payment handling
export interface DutchPaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  fees: {
    percentage: number;
    fixed: number;
  };
  currencies: string[];
  enabled: boolean;
  banks?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export interface PaymentRequest {
  amount: number; // in cents
  currency: string;
  description: string;
  method: string;
  customerId?: string;
  metadata?: Record<string, any>;
  bank?: string; // for iDEAL
  iban?: string; // for SEPA
  discountCode?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentIntent?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    clientSecret?: string;
    redirectUrl?: string;
  };
  error?: string;
}

class DutchPaymentService {
  private apiUrl = '/api/payments';

  // Get available payment methods for Dutch market
  async getPaymentMethods(currency: string = 'EUR'): Promise<DutchPaymentMethod[]> {
    try {
      const response = await fetch(`${this.apiUrl}/methods?currency=${currency}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch payment methods');
      }
      
      return data.methods;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  // Process payment with Dutch payment methods
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Payment processing failed');
      }

      return {
        success: true,
        paymentIntent: data.paymentIntent
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  // Create iDEAL payment
  async createIdealPayment(amount: number, description: string, bankId: string, customerId?: string): Promise<PaymentResponse> {
    return this.processPayment({
      amount,
      currency: 'EUR',
      description,
      method: 'ideal',
      bank: bankId,
      customerId
    });
  }

  // Create SEPA payment
  async createSepaPayment(amount: number, description: string, iban: string, customerId?: string): Promise<PaymentResponse> {
    return this.processPayment({
      amount,
      currency: 'EUR', 
      description,
      method: 'sepa',
      iban,
      customerId
    });
  }

  // Create Bancontact payment
  async createBancontactPayment(amount: number, description: string, customerId?: string): Promise<PaymentResponse> {
    return this.processPayment({
      amount,
      currency: 'EUR',
      description,
      method: 'bancontact',
      customerId
    });
  }

  // Create SOFORT payment
  async createSofortPayment(amount: number, description: string, customerId?: string): Promise<PaymentResponse> {
    return this.processPayment({
      amount,
      currency: 'EUR',
      description,
      method: 'sofort',
      customerId
    });
  }

  // Format EUR price
  formatPrice(amountInCents: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amountInCents / 100);
  }

  // Validate IBAN
  validateIban(iban: string): boolean {
    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    // Basic IBAN validation (simplified)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    
    if (!ibanRegex.test(cleanIban)) {
      return false;
    }

    // Check if it's a Dutch IBAN
    if (cleanIban.startsWith('NL') && cleanIban.length === 18) {
      return true;
    }

    // Allow other EU IBANs but with basic validation
    return cleanIban.length >= 15 && cleanIban.length <= 34;
  }

  // Get Dutch banks for iDEAL
  getDutchBanks() {
    return [
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
  }

  // Calculate total amount including fees
  calculateTotalAmount(baseAmount: number, method: string): number {
    const methodFees: Record<string, { percentage: number; fixed: number }> = {
      stripe: { percentage: 1.4, fixed: 25 },
      ideal: { percentage: 0.29, fixed: 0 },
      bancontact: { percentage: 0.5, fixed: 0 },
      sofort: { percentage: 0.9, fixed: 25 },
      paypal: { percentage: 2.9, fixed: 35 },
      sepa: { percentage: 0.8, fixed: 0 }
    };

    const fees = methodFees[method] || { percentage: 0, fixed: 0 };
    const feeAmount = Math.round((baseAmount * fees.percentage / 100) + fees.fixed);
    
    return baseAmount + feeAmount;
  }

  // Get method display info
  getMethodInfo(methodId: string) {
    const methods: Record<string, { name: string; description: string; icon: string }> = {
      stripe: { 
        name: 'Credit Card / Creditcard', 
        description: 'Betaal met uw creditcard of debitcard', 
        icon: '💳' 
      },
      ideal: { 
        name: 'iDEAL', 
        description: 'Betaal veilig via uw Nederlandse bank', 
        icon: '🏦' 
      },
      bancontact: { 
        name: 'Bancontact', 
        description: 'Belgische betaalkaart', 
        icon: '🇧🇪' 
      },
      sofort: { 
        name: 'SOFORT', 
        description: 'Directe bankoverschrijving', 
        icon: '⚡' 
      },
      paypal: { 
        name: 'PayPal', 
        description: 'Betaal met uw PayPal account', 
        icon: '💙' 
      },
      sepa: { 
        name: 'SEPA Overboeking', 
        description: 'Europese bankoverschrijving', 
        icon: '🏛️' 
      }
    };

    return methods[methodId] || { name: methodId, description: '', icon: '💳' };
  }
}

export const dutchPaymentService = new DutchPaymentService();
export default dutchPaymentService;