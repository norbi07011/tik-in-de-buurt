import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Video from '../models/Video';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get all videos with optional filtering
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      businessId,
      search,
      tags,
      limit = 20,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = { isActive: true };
    
    if (businessId) {
      query.businessId = businessId;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      query.tags = { $in: tagArray };
    }

    // Calculate pagination
    const limitNum = Math.min(parseInt(limit as string), 50);
    const skip = (parseInt(page as string) - 1) * limitNum;

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const videos = await Video.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('authorId')
      .populate('businessId', 'name logoUrl category');

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get video by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const video = await Video.findById(id)
      .populate('authorId', 'name avatar')
      .populate('businessId', 'name logoUrl category');

    if (!video || !video.isActive) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Increment view count
    await video.updateOne({ $inc: { views: 1 } });

    res.json({ video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Create video
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const videoData = {
      ...req.body,
      authorId: user._id,
      authorType: user.businessId ? 'business' : 'user',
      businessId: user.businessId || undefined
    };

    const video = new Video(videoData);
    await video.save();

    const populatedVideo = await Video.findById(video._id)
      .populate('authorId', 'name avatar')
      .populate('businessId', 'name logoUrl category');

    res.status(201).json({
      message: 'Video created successfully',
      video: populatedVideo
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Like/Unlike video
router.post('/:id/like', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const video = await Video.findById(id);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const isLiked = video.likes.includes(userId as any);

    if (isLiked) {
      // Unlike
      video.likes = video.likes.filter(likeId => likeId.toString() !== userId);
    } else {
      // Like
      video.likes.push(userId as any);
    }

    await video.save();

    res.json({
      message: isLiked ? 'Video unliked' : 'Video liked',
      isLiked: !isLiked,
      likeCount: video.likes.length
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ error: 'Failed to update like status' });
  }
});

// Delete video (author only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const video = await Video.findById(id);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    if (video.authorId.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      res.status(403).json({ error: 'Not authorized to delete this video' });
      return;
    }

    await Video.findByIdAndDelete(id);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export default router;