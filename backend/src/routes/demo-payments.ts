import express from 'express';
import { authenticateToken } from '../middleware/auth';
import Business from '../models/Business';

const router = express.Router();

// Demo subscription plans for testing
const DEMO_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49.99,
    interval: 'year' as const,
    features: [
      'Business Profile',
      'Up to 10 Photos',
      'Basic Analytics',
      'Customer Reviews',
      'Contact Information'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99.99,
    interval: 'year' as const,
    features: [
      'Everything in Basic',
      'Unlimited Photos',
      'Video Upload (up to 10)',
      'Advanced Analytics',
      'Priority Support',
      'Social Media Integration'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99,
    interval: 'year' as const,
    features: [
      'Everything in Pro',
      'Unlimited Video Upload',
      'API Access',
      'White-label Solutions',
      'Dedicated Account Manager'
    ]
  }
];

/**
 * GET /api/demo-payments/plans
 * Get all subscription plans (demo version)
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: DEMO_PLANS
  });
});

/**
 * POST /api/demo-payments/simulate-payment
 * Simulate successful payment for testing
 */
router.post('/simulate-payment', authenticateToken, async (req, res) => {
  try {
    const { planId, businessId, simulate = 'success' } = req.body;
    const userId = req.user?.id;

    if (!userId || !planId || !businessId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Simulate different outcomes
    if (simulate === 'decline') {
      return res.status(400).json({
        success: false,
        error: 'Your card was declined.'
      });
    }

    if (simulate === 'network_error') {
      return res.status(500).json({
        success: false,
        error: 'Network error occurred. Please try again.'
      });
    }

    // Find the plan
    const plan = DEMO_PLANS.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    // Verify business ownership
    const business = await Business.findById(businessId);
    if (!business || business.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to business'
      });
    }

    // Simulate successful payment - update business subscription
    business.subscriptionStatus = 'active';
    business.planId = planId;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    business.subscriptionExpiresAt = expiryDate;
    
    // Simulate Stripe IDs
    business.stripeCustomerId = `cus_demo_${Date.now()}`;
    business.stripeSubscriptionId = `sub_demo_${Date.now()}`;
    
    await business.save();

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return res.json({
      success: true,
      data: {
        paymentIntentId: `pi_demo_${Date.now()}`,
        status: 'succeeded',
        plan: plan.name,
        amount: plan.price,
        currency: 'eur',
        expiresAt: expiryDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error simulating payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment simulation failed'
    });
  }
});

/**
 * POST /api/demo-payments/cancel-subscription
 * Cancel subscription (demo version)
 */
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.body;
    const userId = req.user?.id;

    if (!userId || !businessId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify business ownership
    const business = await Business.findById(businessId);
    if (!business || business.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to business'
      });
    }

    // Cancel subscription
    business.subscriptionStatus = 'canceled';
    await business.save();

    return res.json({
      success: true,
      data: {
        subscriptionId: business.stripeSubscriptionId,
        status: 'canceled'
      }
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

export default router;