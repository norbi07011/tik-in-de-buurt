import Stripe from 'stripe';
import { logger } from '../utils/logger';

// Initialize Stripe with secret key (conditional)
let stripe: Stripe | null = null;

// Stripe initialization with fallback
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  });
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  businessId: string;
  planId: string;
  customerEmail: string;
}

export interface CreateSubscriptionRequest {
  customerId: string;
  priceId: string;
  businessId: string;
}

class StripeService {
  
  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<Stripe.PaymentIntent> {
    if (!stripe) {
      throw new Error('Stripe not initialized - missing API key');
    }
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          businessId: data.businessId,
          planId: data.planId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id} for business ${data.businessId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create or retrieve customer
   */
  async createOrGetCustomer(email: string, businessId: string): Promise<Stripe.Customer> {
    if (!stripe) {
      throw new Error('Stripe not initialized - missing API key');
    }
    try {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          businessId,
        },
      });

      logger.info(`Customer created: ${customer.id} for business ${businessId}`);
      return customer;
    } catch (error) {
      logger.error('Error creating/getting customer:', error);
      throw new Error('Failed to create or retrieve customer');
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(data: CreateSubscriptionRequest): Promise<Stripe.Subscription> {
    if (!stripe) {
      throw new Error('Stripe not initialized - missing API key');
    }
    try {
      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [{
          price: data.priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          businessId: data.businessId,
        },
      });

      logger.info(`Subscription created: ${subscription.id} for business ${data.businessId}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!stripe) {
      throw new Error('Stripe not initialized - missing API key');
    }
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      logger.info(`Subscription canceled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!stripe) {
      throw new Error('Stripe not initialized - missing API key');
    }
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      logger.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
    if (!stripe) {
      throw new Error('Stripe not initialized - missing API key');
    }
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      logger.info(`Webhook received: ${event.type}`);
      return event;
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw new Error('Webhook signature verification failed');
    }
  }

  /**
   * Create product and price (for setup)
   */
  async createProduct(plan: SubscriptionPlan): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
    if (!stripe) {
      throw new Error('Stripe not initialized - missing API key');
    }
    try {
      const product = await stripe.products.create({
        name: plan.name,
        description: `TikInDeBuurt ${plan.name} Plan`,
        metadata: {
          planId: plan.id,
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100), // Convert to cents
        currency: 'eur',
        recurring: {
          interval: plan.interval,
        },
        metadata: {
          planId: plan.id,
        },
      });

      logger.info(`Product and price created: ${product.id}, ${price.id}`);
      return { product, price };
    } catch (error) {
      logger.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }
}

// Export Stripe service instance
export const stripeService = new StripeService();
export default stripeService;