import express, { Request, Response } from 'express';
import Video, { IVideo } from '../models/Video';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 📊 TRACK VIDEO VIEW
router.post('/view/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { watchTime = 0, watchPercentage = 0 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Update view count
    video.views += 1;
    await video.save();

    res.json({ 
      message: 'View tracked successfully',
      analytics: {
        views: video.views,
        watchTime,
        watchPercentage
      }
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 👍 LIKE VIDEO
router.post('/like/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    const isLiked = video.likes.includes(userId as any);
    
    if (isLiked) {
      // Unlike
      video.likes = video.likes.filter((id: any) => id.toString() !== userId);
    } else {
      // Like
      video.likes.push(userId as any);
    }

    await video.save();

    res.json({
      message: isLiked ? 'Video unliked' : 'Video liked',
      likes: video.likes.length,
      dislikes: 0, // Not implemented yet
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Error liking video:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// � GET VIDEO ANALYTICS
router.get('/analytics/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Check if user owns this video
    if (video.authorId.toString() !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const analytics = {
      basicStats: {
        views: video.views,
        likes: video.likes.length,
        dislikes: 0, // Not implemented yet
        uploadDate: video.createdAt
      },
      engagement: {
        likeRatio: video.views > 0 ? (video.likes.length / video.views) * 100 : 0
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔥 GET TRENDING VIDEOS
router.get('/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeframe = '24h', limit = 10 } = req.query;
    
    let startDate = new Date();
    switch (timeframe) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    const limitNum = typeof limit === 'string' ? parseInt(limit) : 10;
    
    const videos = await Video.find({
      createdAt: { $gte: startDate }
    })
    .sort({ 
      views: -1, 
      likes: -1 
    })
    .limit(limitNum)
    .lean();

    res.json(videos);
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;