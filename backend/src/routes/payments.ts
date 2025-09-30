import express from 'express';
// TODO: Fix express-validator import configuration
// import * as validator from 'express-validator';
// const { body, param, validationResult } = validator;

// Temporary simple validation function
const simpleValidation = () => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  next();
};
import Stripe from 'stripe';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import Business from '../models/Business';
import DiscountCode from '../models/DiscountCode';

const router = express.Router();

// Initialize payment providers (in production, use environment variables)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion
});

// Payment method configurations for Dutch market
const PAYMENT_CONFIGS = {
  stripe: {
    enabled: true,
    fees: { percentage: 1.4, fixed: 25 },
    currencies: ['EUR'],
    icon: '💳'
  },
  ideal: {
    enabled: true,
    fees: { percentage: 0.29, fixed: 0 },
    currencies: ['EUR'],
    icon: '🏦',
    description: 'iDEAL - Nederlandse banken',
    banks: [
      { id: 'ABNANL2A', name: 'ABN AMRO', icon: '🟢' },
      { id: 'INGBNL2A', name: 'ING Bank', icon: '🧡' },
      { id: 'RABONL2U', name: 'Rabobank', icon: '🔵' },
      { id: 'SNSBNL2A', name: 'SNS Bank', icon: '💜' },
      { id: 'ASNBNL21', name: 'ASN Bank', icon: '🌱' },
      { id: 'BUNQNL2A', name: 'Bunq', icon: '🌈' },
      { id: 'KNABNL2H', name: 'Knab', icon: '⚡' },
      { id: 'REVOLT21', name: 'Revolut', icon: '🔄' },
      { id: 'NTSBDEB1', name: 'N26', icon: '🎯' }
    ]
  },
  bancontact: {
    enabled: true,
    fees: { percentage: 0.5, fixed: 0 },
    currencies: ['EUR'],
    icon: '🇧🇪',
    description: 'Bancontact (België)'
  },
  sofort: {
    enabled: true,
    fees: { percentage: 0.9, fixed: 25 },
    currencies: ['EUR'],
    icon: '⚡',
    description: 'SOFORT Überweisung'
  },
  paypal: {
    enabled: true,
    fees: { percentage: 2.9, fixed: 35 },
    currencies: ['EUR'],
    clientId: process.env.PAYPAL_CLIENT_ID || 'sb-...',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'test-secret',
    icon: '💙',
    description: 'PayPal'
  },
  sepa: {
    enabled: true,
    fees: { percentage: 0.8, fixed: 0 },
    currencies: ['EUR'],
    icon: '🏛️',
    description: 'SEPA Direct Debit'
  }
};

// In-memory storage for demo (use database in production)
const paymentIntents = new Map();
const paymentAnalytics: any[] = [];

// Helper functions
const calculateFees = (method: string, amount: number): number => {
  const config = PAYMENT_CONFIGS[method as keyof typeof PAYMENT_CONFIGS];
  if (!config) return 0;
  return Math.round((amount * config.fees.percentage / 100) + config.fees.fixed);
};

const generateTransactionId = (): string => {
  return `tx_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

const trackAnalytics = (data: any) => {
  paymentAnalytics.push({
    ...data,
    timestamp: new Date(),
    id: crypto.randomUUID()
  });
  
  // Keep only last 1000 records
  if (paymentAnalytics.length > 1000) {
    paymentAnalytics.splice(0, paymentAnalytics.length - 1000);
  }
};

// Validation middleware - simplified without express-validator
const validatePaymentRequest = [
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { amount, currency, description, method } = req.body;
    
    const errors = [];
    
    if (!amount || typeof amount !== 'number' || amount < 1) {
      errors.push({ field: 'amount', message: 'Amount must be a positive integer in cents' });
    }
    
    if (currency !== 'EUR') {
      errors.push({ field: 'currency', message: 'Only EUR currency is supported in the Netherlands' });
    }
    
    if (!description || typeof description !== 'string' || description.trim() === '') {
      errors.push({ field: 'description', message: 'Description is required' });
    }
    
    if (!['stripe', 'ideal', 'bancontact', 'sofort', 'paypal', 'sepa'].includes(method)) {
      errors.push({ field: 'method', message: 'Invalid payment method for Dutch market' });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors 
      });
    }
    return next();
  }
];

// GET /api/payments/methods - Get available payment methods
router.get('/methods', (req: express.Request, res: express.Response) => {
  try {
    const currency = req.query.currency as string || 'EUR';
    
    const methods = Object.entries(PAYMENT_CONFIGS)
      .filter(([_, config]) => config.enabled && config.currencies.includes(currency))
      .map(([id, config]) => ({
        id,
        name: getMethodName(id),
        fees: config.fees,
        currencies: config.currencies,
        enabled: config.enabled,
        icon: (config as any).icon,
        description: (config as any).description,
        banks: (config as any).banks
      }));

    res.json({
      success: true,
      methods,
      currency
    });
  } catch (error) {
    console.error('❌ Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/payments/process - Process payment (with discount codes support)
router.post('/process', validatePaymentRequest, async (req: express.Request, res: express.Response): Promise<void> => {
  const startTime = Date.now();
  let transactionId: string = '';
  
  try {
    const { amount, currency = 'EUR', description, method, customerId, metadata, card, blik, discountCode } = req.body;
    
    let finalAmount = amount;
    let discountDetails = null;

    // Apply discount code if provided
    if (discountCode) {
      try {
        const discountCodeDoc = await DiscountCode.findValidCode(discountCode);
        
        if (discountCodeDoc) {
          const validation = discountCodeDoc.isValid();
          
          if (validation.valid) {
            const planId = metadata.planId || 'basic';
            
            if (discountCodeDoc.canBeUsedForPlan(planId)) {
              const discountResult = discountCodeDoc.calculateDiscount(amount / 100); // Convert from cents
              
              if (!discountResult.error) {
                discountDetails = {
                  code: discountCodeDoc.code,
                  type: discountCodeDoc.type,
                  originalAmount: amount,
                  discountAmount: Math.round(discountResult.discountAmount * 100), // Convert to cents
                  finalAmount: Math.round(discountResult.finalPrice * 100), // Convert to cents
                  description: discountCodeDoc.description
                };
                
                finalAmount = discountDetails.finalAmount;
                
                logger.info(`Discount code applied: ${discountCode} - ${discountResult.discountPercent || 100}% off`);
              }
            }
          }
        }
      } catch (discountError) {
        logger.warn(`Error applying discount code ${discountCode}:`, discountError);
        // Continue with normal payment if discount fails
      }
    }
    
    // Check if method is supported for currency
    const config = PAYMENT_CONFIGS[method as keyof typeof PAYMENT_CONFIGS];
    if (!config || !config.enabled || !config.currencies.includes(currency)) {
      res.status(400).json({
        success: false,
        message: `Payment method ${method} not supported for ${currency}`
      });
      return;
    }

    transactionId = generateTransactionId();
    const fees = calculateFees(method, amount);
    const totalAmount = amount + fees;

    console.log('🔄 Processing payment:', {
      transactionId,
      method,
      amount,
      currency,
      fees,
      totalAmount
    });

    let paymentResult;

    // Process payment based on method
    switch (method) {
      case 'stripe':
        paymentResult = await processStripePayment({
          amount: totalAmount,
          currency,
          description,
          customerId,
          metadata,
          card,
          transactionId
        });
        break;

      case 'ideal':
        paymentResult = await processIdealPayment({
          amount: totalAmount,
          currency,
          description,
          customerId,
          metadata,
          bank: req.body.bank,
          transactionId
        });
        break;

      case 'bancontact':
        paymentResult = await processBancontactPayment({
          amount: totalAmount,
          currency,
          description,
          customerId,
          metadata,
          transactionId
        });
        break;

      case 'sofort':
        paymentResult = await processSofortPayment({
          amount: totalAmount,
          currency,
          description,
          customerId,
          metadata,
          transactionId
        });
        break;

      case 'paypal':
        paymentResult = await processPayPalPayment({
          amount: totalAmount,
          currency,
          description,
          customerId,
          metadata,
          transactionId
        });
        break;

      case 'sepa':
        paymentResult = await processSepaPayment({
          amount: totalAmount,
          currency,
          description,
          customerId,
          metadata,
          iban: req.body.iban,
          transactionId
        });
        break;

      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }

    // Store payment intent
    const paymentIntent = {
      ...paymentResult,
      id: paymentResult.id || transactionId,
      amount,
      currency,
      description,
      customerId,
      metadata,
      status: paymentResult.status || 'succeeded',
      method,
      fees,
      totalAmount,
      created: new Date()
    };

    paymentIntents.set(paymentIntent.id, paymentIntent);

    // Track analytics
    const processingTime = Date.now() - startTime;
    trackAnalytics({
      transactionId: paymentIntent.id,
      method,
      amount,
      currency,
      status: paymentIntent.status,
      processingTime,
      fees,
      userId: customerId,
      metadata
    });

    console.log('✅ Payment processed successfully:', paymentIntent.id);

    res.json({
      success: true,
      paymentIntent,
      transactionId: paymentIntent.id,
      ...(paymentResult && 'clientSecret' in paymentResult && { clientSecret: paymentResult.clientSecret }),
      ...(paymentResult && 'redirectUrl' in paymentResult && { redirectUrl: paymentResult.redirectUrl })
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Payment processing failed:', errorMessage);

    // Track failed analytics
    trackAnalytics({
      transactionId: transactionId || 'unknown',
      method: req.body.method,
      amount: req.body.amount,
      currency: req.body.currency,
      status: 'failed',
      processingTime,
      fees: 0,
      userId: req.body.customerId,
      metadata: { ...req.body.metadata, error: errorMessage }
    });

    res.status(500).json({
      success: false,
      message: errorMessage,
      paymentIntent: {
        id: transactionId || `failed_${Date.now()}`,
        amount: req.body.amount,
        currency: req.body.currency,
        description: req.body.description,
        status: 'failed',
        created: new Date()
      }
    });
  }
});

// Payment processor implementations
async function processStripePayment(data: any) {
  // Simulate Stripe processing
  console.log('🔄 Processing Stripe payment...', data.transactionId);
  
  return {
    id: data.transactionId,
    status: 'succeeded',
    clientSecret: `pi_${data.transactionId}_secret_test`,
    charges: {
      data: [{
        id: `ch_${data.transactionId}`,
        amount: data.amount,
        currency: data.currency
      }]
    }
  };
}

async function processIdealPayment(data: any) {
  console.log('🏦 Processing iDEAL payment...', data.transactionId);
  
  // Validate bank selection
  const validBanks = ['ABNANL2A', 'INGBNL2A', 'RABONL2U', 'SNSBNL2A', 'ASNBNL21', 'BUNQNL2A', 'KNABNL2H', 'REVOLT21', 'NTSBDEB1'];
  if (!data.bank || !validBanks.includes(data.bank)) {
    throw new Error('Invalid bank selection for iDEAL payment');
  }
  
  return {
    id: data.transactionId,
    status: 'pending',
    redirectUrl: `https://sandbox.ideal.nl/payments/${data.transactionId}?bank=${data.bank}`,
    bank: data.bank,
    paymentMethod: 'ideal'
  };
}

async function processBancontactPayment(data: any) {
  console.log('🇧🇪 Processing Bancontact payment...', data.transactionId);
  
  return {
    id: data.transactionId,
    status: 'pending',
    redirectUrl: `https://sandbox.bancontact.be/payments/${data.transactionId}`,
    paymentMethod: 'bancontact'
  };
}

async function processSofortPayment(data: any) {
  console.log('⚡ Processing SOFORT payment...', data.transactionId);
  
  return {
    id: data.transactionId,
    status: 'pending',
    redirectUrl: `https://sandbox.sofort.com/payment/${data.transactionId}`,
    paymentMethod: 'sofort'
  };
}

async function processPayPalPayment(data: any) {
  console.log('� Processing PayPal payment...', data.transactionId);
  
  return {
    id: data.transactionId,
    status: 'pending',
    redirectUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${data.transactionId}`,
    approval_url: `https://www.sandbox.paypal.com/checkoutnow?token=${data.transactionId}`,
    paymentMethod: 'paypal'
  };
}

async function processSepaPayment(data: any) {
  console.log('🏛️ Processing SEPA payment...', data.transactionId);
  
  // Validate IBAN format (basic validation)
  if (!data.iban || !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(data.iban.replace(/\s/g, ''))) {
    throw new Error('Invalid IBAN format for SEPA payment');
  }
  
  return {
    id: data.transactionId,
    status: 'processing',
    iban: data.iban,
    paymentMethod: 'sepa',
    estimatedProcessingTime: '1-3 business days'
  };
}

// Helper function to get method display name
function getMethodName(methodId: string): string {
  const names = {
    stripe: 'Credit Card / Creditcard',
    ideal: 'iDEAL - Nederlandse banken',
    bancontact: 'Bancontact (België)',
    sofort: 'SOFORT Überweisung',
    paypal: 'PayPal',
    sepa: 'SEPA Overboeking'
  };
  return names[methodId as keyof typeof names] || methodId;
}

// Subscription plans configuration
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49.99, // EUR per year
    interval: 'year' as const,
    features: [
      'Business Profile',
      'Up to 10 Photos',
      'Basic Analytics',
      'Customer Reviews',
      'Contact Information'
    ],
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_yearly',
  },
  {
    id: 'pro',
    name: 'Pro', 
    price: 99.99, // EUR per year
    interval: 'year' as const,
    features: [
      'Everything in Basic',
      'Unlimited Photos',
      'Video Upload (up to 10)',
      'Advanced Analytics',
      'Priority Support',
      'Social Media Integration',
      'Custom Business Hours',
      'Multiple Locations'
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_yearly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99, // EUR per year
    interval: 'year' as const,
    features: [
      'Everything in Pro',
      'Unlimited Video Upload',
      'API Access',
      'White-label Solutions',
      'Dedicated Account Manager',
      'Custom Integrations',
      'Advanced Security',
      'Priority Listing'
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_yearly',
  }
];

/**
 * GET /api/payments/plans
 * Get all subscription plans
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: SUBSCRIPTION_PLANS.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
    }))
  });
});

/**
 * POST /api/payments/create-payment-intent
 * Create payment intent for one-time payment
 */
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Stripe not configured. Use /api/demo-payments for testing.'
  });
});

/**
 * POST /api/payments/create-subscription
 * Create subscription
 */
router.post('/create-subscription', authenticateToken, async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Stripe not configured. Use /api/demo-payments for testing.'
  });
});

/**
 * POST /api/payments/cancel-subscription
 * Cancel subscription
 */
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Stripe not configured. Use /api/demo-payments for testing.'
  });
});

/**
 * POST /api/payments/activate-free
 * Activate free subscription using discount code
 */
router.post('/activate-free', authenticateToken, async (req, res) => {
  try {
    const { businessId, planId, discountCode, freeMonths } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Validate required fields
    if (!businessId || !planId || !discountCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessId, planId, discountCode'
      });
    }

    // Find the business and verify ownership
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    if (business.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only activate subscription for your own business'
      });
    }

    // Verify discount code is still valid and is for free subscription
    const discount = await DiscountCode.findOne({ 
      code: discountCode.toUpperCase(),
      isActive: true,
      type: { $in: ['free_year', 'free_lifetime'] }
    });

    if (!discount) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired discount code'
      });
    }

    // Check if discount code has usage limits
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return res.status(400).json({
        success: false,
        error: 'Discount code usage limit exceeded'
      });
    }

    // Check date validity
    const now = new Date();
    if (discount.validFrom > now) {
      return res.status(400).json({
        success: false,
        error: 'Discount code not yet valid'
      });
    }
    if (discount.validUntil && discount.validUntil < now) {
      return res.status(400).json({
        success: false,
        error: 'Discount code has expired'
      });
    }

    // Calculate subscription end date
    let subscriptionEnd: Date;
    if (discount.type === 'free_lifetime') {
      // Set to far future date for lifetime (e.g., 100 years from now)
      subscriptionEnd = new Date();
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 100);
    } else if (discount.type === 'free_year') {
      subscriptionEnd = new Date();
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    } else {
      // Fallback to freeMonths parameter
      subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + (freeMonths || 12));
    }

    // Find the plan details
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    // Update business with subscription details
    business.subscription = {
      planId: planId,
      status: 'active',
      startDate: new Date(),
      endDate: subscriptionEnd,
      paymentMethod: 'free_code',
      paymentStatus: 'paid',
      lastPayment: new Date(),
      autoRenewal: false, // Free subscriptions don't auto-renew
      metadata: {
        discountCode: discountCode,
        originalPrice: plan.price,
        discountType: discount.type,
        freeMonths: discount.type === 'free_year' ? 12 : (discount.type === 'free_lifetime' ? null : freeMonths)
      }
    };

    await business.save();

    // Mark discount code as used
    discount.usageCount += 1;
    discount.usedBy.push({
      businessId: businessId,
      usedAt: new Date(),
      originalPrice: plan.price,
      discountApplied: plan.price, // Full price discounted for free subscriptions
      finalPrice: 0
    });
    await discount.save();

    logger.info(`Free subscription activated for business ${businessId} using code ${discountCode}`);

    res.json({
      success: true,
      data: {
        subscriptionId: business._id?.toString() || businessId,
        status: 'active',
        planId: planId,
        startDate: business.subscription.startDate,
        endDate: business.subscription.endDate,
        type: discount.type,
        freeMonths: business.subscription.metadata?.freeMonths || null
      }
    });

  } catch (error) {
    logger.error('Error activating free subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate free subscription'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Stripe webhooks not configured. Use /api/demo-payments for testing.'
  });
});

export default router;