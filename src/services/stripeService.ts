import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export interface PaymentIntentResponse {
  success: boolean;
  data?: {
    clientSecret: string;
    paymentIntentId: string;
  };
  error?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  data?: {
    subscriptionId: string;
    clientSecret?: string;
    status: string;
  };
  error?: string;
}

class StripeServiceClass {
  
  /**
   * Get all subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payments/plans`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get plans');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error getting plans:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for one-time payment
   */
  async createPaymentIntent(planId: string, businessId: string, customAmount?: number): Promise<PaymentIntentResponse> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          planId, 
          businessId,
          amount: customAmount
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment intent' 
      };
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(planId: string, businessId: string): Promise<SubscriptionResponse> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payments/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId, businessId })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create subscription' 
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(businessId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ businessId })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel subscription' 
      };
    }
  }

  /**
   * Process payment with Stripe Elements
   */
  async processPayment(
    clientSecret: string, 
    confirmationData?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        redirect: 'if_required',
        ...confirmationData
      });

      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Payment not completed' 
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    }
  }

  /**
   * Get Stripe instance
   */
  async getStripeInstance() {
    return await getStripe();
  }
}

export const stripeService = new StripeServiceClass();
export default stripeService;