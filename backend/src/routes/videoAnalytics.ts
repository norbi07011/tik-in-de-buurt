import express, { Request, Response } from 'express';
import Video, { IVideo } from '../models/Video';
import { authenticateToken } from '../middleware/auth';
import { VideoAnalyticsService } from '../services/videoAnalyticsService';
import { VideoRecommendationService } from '../services/videoRecommendationService';
import { logger } from '../utils/logger';

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

// 🚀 ENHANCED VIDEO ANALYTICS ENDPOINTS

/**
 * POST /api/video-analytics/enhanced/record
 * Rejestruje zaawansowane wydarzenia związane z oglądaniem wideo
 */
router.post('/enhanced/record', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      videoId,
      businessId,
      event,
      watchTime,
      totalDuration,
      currentTime,
      quality,
      playbackRate,
      dropOffPoint
    } = req.body;

    const userId = req.user?.id || 'anonymous';

    // Record enhanced analytics event
    await VideoAnalyticsService.recordVideoEvent({
      videoId,
      userId,
      businessId,
      watchTime: watchTime || 0,
      totalDuration: totalDuration || 0,
      dropOffPoints: dropOffPoint ? [dropOffPoint] : [],
      deviceInfo: {
        type: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        browser: 'unknown',
        os: 'unknown'
      },
      quality: quality || 'auto',
      playbackSpeed: playbackRate || 1,
      interactions: { likes: 0, shares: 0, comments: 0, saves: 0 }
    });

    // Update user profile for recommendations
    if (event === 'watch' || event === 'complete') {
      await VideoRecommendationService.updateUserProfile(userId, {
        videoId,
        category: req.body.category || 'general',
        watchTime: watchTime || 0,
        duration: totalDuration || 0,
        action: event === 'complete' ? 'complete' : 'watch'
      });
    }

    logger.info(`Enhanced video analytics recorded: ${event} for video ${videoId} by user ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Enhanced analytics recorded successfully'
    });

  } catch (error) {
    logger.error('Error recording enhanced video analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record enhanced analytics'
    });
  }
});

/**
 * POST /api/video-analytics/enhanced/interaction
 * Rejestruje interakcje użytkownika (like, share, save)
 */
router.post('/enhanced/interaction', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId, businessId, action, category } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Update user profile
    await VideoRecommendationService.updateUserProfile(userId, {
      videoId,
      category: category || 'general',
      watchTime: 0,
      duration: 0,
      action: action as 'like' | 'share'
    });

    logger.info(`Video interaction recorded: ${action} for video ${videoId} by user ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Interaction recorded successfully'
    });

  } catch (error) {
    logger.error('Error recording video interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record interaction'
    });
  }
});

/**
 * GET /api/video-analytics/enhanced/metrics/:videoId
 * Pobiera zaawansowane metryki dla konkretnego wideo
 */
router.get('/enhanced/metrics/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const metrics = await VideoAnalyticsService.getVideoMetrics(videoId);

    if (!metrics) {
      res.status(404).json({
        success: false,
        message: 'No enhanced metrics found for this video'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Error getting enhanced video metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced video metrics'
    });
  }
});

/**
 * GET /api/video-analytics/enhanced/recommendations
 * Pobiera AI-powered rekomendacje wideo dla użytkownika
 */
router.get('/enhanced/recommendations', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'anonymous';
    const limit = parseInt(req.query.limit as string) || 10;
    const excludeWatched = req.query.excludeWatched !== 'false';

    const recommendations = await VideoRecommendationService.getRecommendationsForUser(
      userId,
      limit,
      excludeWatched
    );

    res.status(200).json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    logger.error('Error getting AI video recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI recommendations'
    });
  }
});

/**
 * GET /api/video-analytics/enhanced/similar/:videoId
 * Pobiera podobne wideo używając AI
 */
router.get('/enhanced/similar/:videoId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const similarVideos = await VideoRecommendationService.getSimilarVideos(videoId, limit);

    res.status(200).json({
      success: true,
      data: similarVideos
    });

  } catch (error) {
    logger.error('Error getting similar videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar videos'
    });
  }
});

/**
 * GET /api/video-analytics/enhanced/trending
 * Pobiera AI-powered trending videos
 */
router.get('/enhanced/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const trendingVideos = await VideoRecommendationService.getTrendingVideos(limit);

    res.status(200).json({
      success: true,
      data: trendingVideos
    });

  } catch (error) {
    logger.error('Error getting AI trending videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI trending videos'
    });
  }
});

/**
 * POST /api/video-analytics/enhanced/register-video
 * Rejestruje nowe wideo w AI recommendation system
 */
router.post('/enhanced/register-video', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      id,
      title,
      businessName,
      category,
      thumbnailUrl,
      duration,
      rating
    } = req.body;

    VideoRecommendationService.addVideoToDatabase({
      id,
      title,
      businessName,
      category,
      thumbnailUrl,
      duration,
      rating
    });

    logger.info(`Video registered in AI recommendation system: ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Video registered in AI system successfully'
    });

  } catch (error) {
    logger.error('Error registering video in AI system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register video in AI system'
    });
  }
});

export default router;