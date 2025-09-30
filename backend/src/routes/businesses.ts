import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Business from '../models/Business';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get all businesses with optional filtering
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      category, 
      city, 
      search,
      limit = 20,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};
    
    // In production, only show active businesses
    if (process.env.NODE_ENV === 'production') {
      query.subscriptionStatus = 'active';
    }
    
    if (category) {
      query.category = category;
    }
    
    if (city) {
      query['address.city'] = new RegExp(city as string, 'i');
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    // Calculate pagination
    const limitNum = Math.min(parseInt(limit as string), 50);
    const skip = (parseInt(page as string) - 1) * limitNum;

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const businesses = await Business.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('ownerId', 'name email');

    const total = await Business.countDocuments(query);

    res.json({
      businesses,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get business by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const business = await Business.findById(id)
      .populate('ownerId', 'name email avatar');

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    res.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// Create/Update business (owner only)
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const businessData = {
      ...req.body,
      ownerId: user._id
    };

    const business = new Business(businessData);
    await business.save();

    // Update user with business reference
    await user.updateOne({ businessId: business._id });

    res.status(201).json({
      message: 'Business created successfully',
      business
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

// Update business (owner only)
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if user owns this business
    const business = await Business.findById(id);
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    if (business.ownerId.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      res.status(403).json({ error: 'Not authorized to update this business' });
      return;
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Business updated successfully',
      business: updatedBusiness
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// Delete business (owner only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const business = await Business.findById(id);
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    if (business.ownerId.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      res.status(403).json({ error: 'Not authorized to delete this business' });
      return;
    }

    await Business.findByIdAndDelete(id);

    // Remove business reference from user
    await user.updateOne({ $unset: { businessId: 1 } });

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

export default router;