import { PaymentIntent, PaymentMethod, PaymentResult } from '../components/payment/EnhancedPaymentSystem';

export interface PaymentConfig {
  stripe: {
    publicKey: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  paypal: {
    clientId: string;
    clientSecret?: string;
    mode: 'sandbox' | 'live';
  };
  przelewy24: {
    merchantId: number;
    posId: number;
    key: string;
    mode: 'sandbox' | 'live';
  };
  payu: {
    posId: string;
    key: string;
    clientId: string;
    clientSecret?: string;
    mode: 'sandbox' | 'live';
  };
}

export interface PaymentAnalytics {
  transactionId: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  processingTime: number;
  fees: number;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PaymentService {
  private config: Partial<PaymentConfig> = {};
  private analytics: PaymentAnalytics[] = [];
  private cache = new Map<string, any>();
  private rateLimiter = new Map<string, number[]>();

  constructor() {
    this.loadConfig();
    this.setupEventListeners();
  }

  private loadConfig() {
    // Load from environment or local storage
    this.config = {
      stripe: {
        publicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_...',
      },
      paypal: {
        clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || 'sb-...',
        mode: (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox') as 'sandbox' | 'live'
      },
      przelewy24: {
        merchantId: parseInt(process.env.REACT_APP_P24_MERCHANT_ID || '12345'),
        posId: parseInt(process.env.REACT_APP_P24_POS_ID || '12345'),
        key: process.env.REACT_APP_P24_KEY || 'test-key',
        mode: (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox') as 'sandbox' | 'live'
      },
      payu: {
        posId: process.env.REACT_APP_PAYU_POS_ID || 'test-pos',
        key: process.env.REACT_APP_PAYU_KEY || 'test-key',
        clientId: process.env.REACT_APP_PAYU_CLIENT_ID || 'test-client',
        mode: (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox') as 'sandbox' | 'live'
      }
    };
  }

  private setupEventListeners() {
    // Listen for payment events
    window.addEventListener('payment-success', this.handlePaymentSuccess.bind(this) as EventListener);
    window.addEventListener('payment-error', this.handlePaymentError.bind(this) as EventListener);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  private handlePaymentSuccess(event: CustomEvent) {
    console.log('✅ Payment success event:', event.detail);
    this.trackAnalytics(event.detail);
  }

  private handlePaymentError(event: CustomEvent) {
    console.error('❌ Payment error event:', event.detail);
    this.trackAnalytics({ ...event.detail, status: 'failed' });
  }

  private cleanup() {
    // Save analytics to localStorage before page unload
    localStorage.setItem('payment-analytics', JSON.stringify(this.analytics));
  }

  private isRateLimited(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.rateLimiter.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return true;
    }
    
    validRequests.push(now);
    this.rateLimiter.set(identifier, validRequests);
    return false;
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private trackAnalytics(data: Partial<PaymentAnalytics>) {
    const analytics: PaymentAnalytics = {
      transactionId: data.transactionId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method: data.method || 'unknown',
      amount: data.amount || 0,
      currency: data.currency || 'PLN',
      status: data.status || 'unknown',
      processingTime: data.processingTime || 0,
      fees: data.fees || 0,
      userId: data.userId,
      timestamp: new Date(),
      metadata: data.metadata
    };
    
    this.analytics.push(analytics);
    
    // Keep only last 1000 records
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
  }

  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    description: string;
    method: string;
    customerId?: string;
    metadata?: Record<string, any>;
    card?: any;
    blik?: any;
  }): Promise<PaymentResult> {
    const startTime = Date.now();
    
    try {
      // Rate limiting
      const identifier = data.customerId || 'anonymous';
      if (this.isRateLimited(identifier)) {
        throw new Error('Too many requests. Please try again later.');
      }

      // Validate input
      if (!data.amount || data.amount <= 0) {
        throw new Error('Invalid amount');
      }
      
      if (!data.method) {
        throw new Error('Payment method is required');
      }

      // Check cache for duplicate requests
      const cacheKey = `${data.method}_${data.amount}_${data.currency}_${data.customerId || 'anon'}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) { // 30s cache
          console.log('🔄 Returning cached payment intent');
          return cached.result;
        }
      }

      console.log('🔄 Creating payment intent...', {
        method: data.method,
        amount: data.amount,
        currency: data.currency
      });

      // Create payment intent based on method
      let result: PaymentResult;

      switch (data.method) {
        case 'stripe':
          result = await this.processStripePayment(data);
          break;
        case 'blik':
          result = await this.processBlikPayment(data);
          break;
        case 'przelewy24':
          result = await this.processPrzelewy24Payment(data);
          break;
        case 'paypal':
          result = await this.processPayPalPayment(data);
          break;
        case 'payu':
          result = await this.processPayUPayment(data);
          break;
        default:
          throw new Error(`Unsupported payment method: ${data.method}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      // Track analytics
      const processingTime = Date.now() - startTime;
      this.trackAnalytics({
        transactionId: result.paymentIntent.id,
        method: data.method,
        amount: data.amount,
        currency: data.currency,
        status: result.success ? 'succeeded' : 'failed',
        processingTime,
        fees: this.calculateFees(data.method, data.amount),
        userId: data.customerId,
        metadata: data.metadata
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Payment intent creation failed:', errorMessage);
      
      // Track failed analytics
      this.trackAnalytics({
        method: data.method,
        amount: data.amount,
        currency: data.currency,
        status: 'failed',
        processingTime,
        fees: 0,
        userId: data.customerId,
        metadata: { ...data.metadata, error: errorMessage }
      });

      // Return error result
      return {
        success: false,
        paymentIntent: {
          id: `failed_${Date.now()}`,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          status: 'failed',
          created: new Date()
        },
        error: errorMessage
      };
    }
  }

  private async processStripePayment(data: any): Promise<PaymentResult> {
    // Simulate Stripe API call
    const response = await this.makeRequest('/api/payments/stripe/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customer: data.customerId,
        metadata: data.metadata,
        payment_method_data: {
          type: 'card',
          card: data.card
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Stripe payment failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      paymentIntent: {
        id: result.id,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customerId: data.customerId,
        metadata: data.metadata,
        status: 'succeeded',
        method: 'stripe',
        created: new Date()
      },
      clientSecret: result.client_secret,
      transactionId: result.id
    };
  }

  private async processBlikPayment(data: any): Promise<PaymentResult> {
    // Simulate BLIK API call
    const response = await this.makeRequest('/api/payments/blik/create-payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        blik_code: data.blik.code,
        customer: data.customerId,
        metadata: data.metadata
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'BLIK payment failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      paymentIntent: {
        id: result.id,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customerId: data.customerId,
        metadata: data.metadata,
        status: 'succeeded',
        method: 'blik',
        created: new Date()
      },
      transactionId: result.transaction_id
    };
  }

  private async processPrzelewy24Payment(data: any): Promise<PaymentResult> {
    // Simulate Przelewy24 API call
    const response = await this.makeRequest('/api/payments/przelewy24/create-transaction', {
      method: 'POST',
      body: JSON.stringify({
        merchantId: this.config.przelewy24?.merchantId,
        posId: this.config.przelewy24?.posId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        email: data.email || 'customer@example.com',
        customer: data.customerId,
        metadata: data.metadata
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Przelewy24 payment failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      paymentIntent: {
        id: result.token,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customerId: data.customerId,
        metadata: data.metadata,
        status: 'pending',
        method: 'przelewy24',
        created: new Date()
      },
      redirectUrl: result.redirect_url,
      transactionId: result.token
    };
  }

  private async processPayPalPayment(data: any): Promise<PaymentResult> {
    // Simulate PayPal API call
    const response = await this.makeRequest('/api/payments/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customer: data.customerId,
        metadata: data.metadata
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'PayPal payment failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      paymentIntent: {
        id: result.id,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customerId: data.customerId,
        metadata: data.metadata,
        status: 'pending',
        method: 'paypal',
        created: new Date()
      },
      redirectUrl: result.approval_url,
      transactionId: result.id
    };
  }

  private async processPayUPayment(data: any): Promise<PaymentResult> {
    // Simulate PayU API call
    const response = await this.makeRequest('/api/payments/payu/create-order', {
      method: 'POST',
      body: JSON.stringify({
        merchantPosId: this.config.payu?.posId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        buyer: {
          email: data.email || 'customer@example.com'
        },
        customer: data.customerId,
        metadata: data.metadata
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'PayU payment failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      paymentIntent: {
        id: result.orderId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customerId: data.customerId,
        metadata: data.metadata,
        status: 'pending',
        method: 'payu',
        created: new Date()
      },
      redirectUrl: result.redirectUri,
      transactionId: result.orderId
    };
  }

  private calculateFees(method: string, amount: number): number {
    const feeRates = {
      stripe: { percentage: 1.4, fixed: 25 },
      blik: { percentage: 0.5, fixed: 0 },
      przelewy24: { percentage: 1.2, fixed: 0 },
      paypal: { percentage: 2.9, fixed: 35 },
      payu: { percentage: 1.5, fixed: 0 }
    };
    
    const rates = feeRates[method as keyof typeof feeRates] || { percentage: 0, fixed: 0 };
    return Math.round((amount * rates.percentage / 100) + rates.fixed);
  }

  async getPaymentMethods(currency: string = 'PLN'): Promise<PaymentMethod[]> {
    const methods: PaymentMethod[] = [
      {
        id: 'stripe',
        type: 'stripe',
        name: 'Karta płatnicza',
        icon: '💳',
        enabled: true,
        fees: { percentage: 1.4, fixed: 25 },
        processingTime: 'Natychmiastowe',
        description: 'Visa, Mastercard, American Express',
        currencies: ['PLN', 'EUR', 'USD']
      },
      {
        id: 'blik',
        type: 'stripe',
        name: 'BLIK',
        icon: '📱',
        enabled: currency === 'PLN',
        fees: { percentage: 0.5, fixed: 0 },
        processingTime: 'Natychmiastowe',
        description: 'Płatność przez telefon',
        currencies: ['PLN']
      },
      {
        id: 'przelewy24',
        type: 'stripe',
        name: 'Przelewy24',
        icon: '🏪',
        enabled: currency === 'PLN',
        fees: { percentage: 1.2, fixed: 0 },
        processingTime: '1-2 dni robocze',
        description: 'Przelew bankowy online',
        currencies: ['PLN']
      },
      {
        id: 'paypal',
        type: 'paypal',
        name: 'PayPal',
        icon: '🅿️',
        enabled: true,
        fees: { percentage: 2.9, fixed: 35 },
        processingTime: 'Natychmiastowe',
        description: 'Płatność PayPal lub kartą',
        currencies: ['PLN', 'EUR', 'USD']
      },
      {
        id: 'payu',
        type: 'stripe',
        name: 'PayU',
        icon: '💰',
        enabled: currency === 'PLN',
        fees: { percentage: 1.5, fixed: 0 },
        processingTime: 'Natychmiastowe',
        description: 'Szybkie płatności online',
        currencies: ['PLN']
      }
    ];

    return methods.filter(method => 
      method.enabled && method.currencies.includes(currency)
    );
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const response = await this.makeRequest(`/api/payments/status/${paymentIntentId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get payment status:', error);
      return null;
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          amount
        })
      });

      if (!response.ok) {
        throw new Error('Refund failed');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ Refund failed:', error);
      return false;
    }
  }

  getAnalytics(): PaymentAnalytics[] {
    return [...this.analytics];
  }

  clearCache(): void {
    this.cache.clear();
    this.rateLimiter.clear();
  }

  updateConfig(newConfig: Partial<PaymentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const paymentService = new PaymentService();
export default paymentService;