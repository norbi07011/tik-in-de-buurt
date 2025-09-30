import express from 'express';
import DiscountCode from '../models/DiscountCode';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Admin middleware - check if user is admin
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const adminEmails = ['odzeradomilionera708@gmail.com', 'admin@tikindeuurt.nl'];
  const userEmail = req.user?.email;
  
  if (!userEmail || !adminEmails.includes(userEmail)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  
  next();
};

// 🔍 Validate discount code (public endpoint)
router.post('/validate', async (req, res) => {
  try {
    const { code, planId } = req.body;
    
    if (!code || !planId) {
      res.status(400).json({ error: 'Code and planId are required' });
      return;
    }
    
    const discountCode = await DiscountCode.findValidCode(code);
    
    if (!discountCode) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Invalid or expired discount code' 
      });
    }
    
    const validation = discountCode.isValid();
    if (!validation.valid) {
      res.status(400).json({
        valid: false,
        error: validation.reason
      });
      return;
    }
    
    if (!discountCode.canBeUsedForPlan(planId)) {
      res.status(400).json({
        valid: false,
        error: 'Code not applicable for this plan'
      });
      return;
    }
    
    res.json({
      valid: true,
      code: discountCode.code,
      type: discountCode.type,
      description: discountCode.description,
      ...(discountCode.type === 'percentage' && { discountPercent: discountCode.value })
    });
    
  } catch (error) {
    logger.error('Error validating discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 💰 Apply discount code to price calculation
router.post('/apply', async (req, res) => {
  try {
    const { code, planId, originalPrice } = req.body;
    
    if (!code || !planId || !originalPrice) {
      return res.status(400).json({ error: 'Code, planId, and originalPrice are required' });
    }
    
    const discountCode = await DiscountCode.findValidCode(code);
    
    if (!discountCode) {
      return res.status(404).json({ error: 'Invalid discount code' });
    }
    
    const validation = discountCode.isValid();
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }
    
    if (!discountCode.canBeUsedForPlan(planId)) {
      return res.status(400).json({ error: 'Code not applicable for this plan' });
    }
    
    const discountResult = discountCode.calculateDiscount(originalPrice);
    
    if (discountResult.error) {
      return res.status(400).json({ error: discountResult.error });
    }
    
    res.json({
      code: discountCode.code,
      description: discountCode.description,
      originalPrice,
      ...discountResult
    });
    
  } catch (error) {
    logger.error('Error applying discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📝 Mark discount code as used (called after successful payment)
router.post('/mark-used', authenticateToken, async (req, res) => {
  try {
    const { code, businessId, originalPrice, discountApplied, finalPrice } = req.body;
    
    const discountCode = await DiscountCode.findValidCode(code);
    
    if (!discountCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }
    
    await discountCode.markAsUsed(businessId, originalPrice, discountApplied, finalPrice);
    
    res.json({ success: true, message: 'Discount code marked as used' });
    
  } catch (error) {
    logger.error('Error marking discount code as used:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🛡️ ADMIN ENDPOINTS

// 📋 Get all discount codes (admin only)
router.get('/admin/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    
    const filter: any = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    const discountCodes = await DiscountCode.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    
    const total = await DiscountCode.countDocuments(filter);
    
    res.json({
      discountCodes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
    
  } catch (error) {
    logger.error('Error fetching discount codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ➕ Create new discount code (admin only)
router.post('/admin/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      description,
      usageLimit,
      validUntil,
      applicablePlans,
      metadata
    } = req.body;
    
    // Validation
    if (!code || !type || !description) {
      return res.status(400).json({ error: 'Code, type, and description are required' });
    }
    
    if (type === 'percentage' && (value === undefined || value < 0 || value > 100)) {
      return res.status(400).json({ error: 'Percentage value must be between 0 and 100' });
    }
    
    // Check if code already exists
    const existingCode = await DiscountCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ error: 'Code already exists' });
    }
    
    const discountCode = await DiscountCode.createAdminCode({
      code,
      type,
      value: type === 'percentage' ? value : undefined,
      description,
      usageLimit: usageLimit || null,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      applicablePlans: applicablePlans || ['all'],
      metadata: metadata || {}
    });
    
    logger.info(`Admin created discount code: ${discountCode.code} (${discountCode.type})`);
    
    res.status(201).json({
      success: true,
      discountCode: {
        id: (discountCode as any)._id,
        code: discountCode.code,
        type: discountCode.type,
        value: discountCode.value,
        description: discountCode.description,
        isActive: discountCode.isActive,
        usageLimit: discountCode.usageLimit,
        usageCount: discountCode.usageCount,
        validUntil: discountCode.validUntil,
        applicablePlans: discountCode.applicablePlans
      }
    });
    
  } catch (error) {
    logger.error('Error creating discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✏️ Update discount code (admin only)
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const discountCode = await DiscountCode.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    
    if (!discountCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }
    
    logger.info(`Admin updated discount code: ${discountCode.code}`);
    
    res.json({ success: true, discountCode });
    
  } catch (error) {
    logger.error('Error updating discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🗑️ Delete discount code (admin only)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const discountCode = await DiscountCode.findByIdAndDelete(id);
    
    if (!discountCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }
    
    logger.info(`Admin deleted discount code: ${discountCode.code}`);
    
    res.json({ success: true, message: 'Discount code deleted' });
    
  } catch (error) {
    logger.error('Error deleting discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📊 Get discount code usage statistics (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await DiscountCode.aggregate([
      {
        $group: {
          _id: null,
          totalCodes: { $sum: 1 },
          activeCodes: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalUsage: { $sum: '$usageCount' },
          percentageCodes: { $sum: { $cond: [{ $eq: ['$type', 'percentage'] }, 1, 0] } },
          freeYearCodes: { $sum: { $cond: [{ $eq: ['$type', 'free_year'] }, 1, 0] } },
          lifetimeCodes: { $sum: { $cond: [{ $eq: ['$type', 'free_lifetime'] }, 1, 0] } }
        }
      }
    ]);
    
    const topUsedCodes = await DiscountCode.find({ usageCount: { $gt: 0 } })
      .sort({ usageCount: -1 })
      .limit(10)
      .select('code description usageCount type value');
    
    res.json({
      stats: stats[0] || {},
      topUsedCodes
    });
    
  } catch (error) {
    logger.error('Error fetching discount code stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🎯 Quick create predefined codes (admin only)
router.post('/admin/quick-create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type: quickType } = req.body;
    
    let codeData: any;
    
    switch (quickType) {
      case 'welcome20':
        codeData = {
          code: 'WELCOME20',
          type: 'percentage',
          value: 20,
          description: 'Welcome discount - 20% off first subscription',
          usageLimit: 100,
          applicablePlans: ['all']
        };
        break;
        
      case 'free_year':
        codeData = {
          code: `FREEYEAR${Date.now().toString().slice(-6)}`,
          type: 'free_year',
          description: 'Free subscription for 1 year',
          usageLimit: 1,
          applicablePlans: ['all']
        };
        break;
        
      case 'lifetime':
        codeData = {
          code: `LIFETIME${Date.now().toString().slice(-6)}`,
          type: 'free_lifetime',
          description: 'Lifetime free subscription',
          usageLimit: 1,
          applicablePlans: ['all']
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid quick create type' });
    }
    
    const discountCode = await DiscountCode.createAdminCode(codeData);
    
    logger.info(`Admin quick-created discount code: ${discountCode.code} (${quickType})`);
    
    res.status(201).json({
      success: true,
      discountCode: {
        id: (discountCode as any)._id,
        code: discountCode.code,
        type: discountCode.type,
        value: discountCode.value,
        description: discountCode.description
      }
    });
    
  } catch (error) {
    logger.error('Error quick-creating discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;