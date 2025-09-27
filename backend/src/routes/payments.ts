import express from 'express';
// import { stripeService } from '../services/stripeService'; // Temporarily disabled
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import Business from '../models/Business';

const router = express.Router();

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