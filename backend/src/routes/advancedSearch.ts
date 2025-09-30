import express, { Request, Response } from 'express';
import { AdvancedSearchService, SearchQuery } from '../services/advancedSearchService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route POST /api/search/advanced
 * @desc Perform advanced search with AI ranking
 * @access Public (optional auth for personalization)
 */
router.post('/advanced', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const searchQuery: SearchQuery = req.body;
    const userId = (req as any).user?.id;

    logger.info('🔍 Advanced search request:', { 
      query: searchQuery.text,
      userId,
      filters: Object.keys(searchQuery).filter(k => k !== 'text' && searchQuery[k as keyof SearchQuery])
    });

    // Validate search query
    if (!searchQuery.text && !searchQuery.category && !searchQuery.location) {
      res.status(400).json({
        success: false,
        message: 'At least one search parameter (text, category, or location) is required'
      });
      return;
    }

    const results = await AdvancedSearchService.search(searchQuery, userId);

    res.json({
      success: true,
      data: results,
      query: searchQuery,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during search',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/suggestions
 * @desc Get search suggestions with AI
 * @access Public
 */
router.get('/suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query } = req.query as { q?: string };

    if (!query) {
      // Return popular suggestions
      const suggestions = await AdvancedSearchService.generateSuggestions('');
      res.json({
        success: true,
        suggestions,
        type: 'popular'
      });
      return;
    }

    const suggestions = await AdvancedSearchService.generateSuggestions(query);

    res.json({
      success: true,
      suggestions,
      query,
      type: 'ai-generated'
    });

  } catch (error) {
    logger.error('❌ Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/search/nlp
 * @desc Parse natural language query
 * @access Public
 */
router.post('/nlp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Query text is required'
      });
      return;
    }

    const parsedQuery = AdvancedSearchService.parseNaturalLanguageQuery(query);

    res.json({
      success: true,
      original: query,
      parsed: parsedQuery,
      intent: {
        hasLocation: !!parsedQuery.location,
        hasFilters: Object.keys(parsedQuery).length > 2, // More than just text and maybe one other
        confidence: 0.85 // Mock confidence score
      }
    });

  } catch (error) {
    logger.error('❌ NLP parsing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse natural language query',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/analytics
 * @desc Get search analytics data
 * @access Private (Admin only)
 */
router.get('/analytics', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is admin (you might want to implement proper role checking)
    const userId = (req as any).user?.id;
    
    // For now, allow any authenticated user - in production, check admin role
    if (!userId) {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { from, to } = req.query;
    let timeRange;

    if (from && to) {
      timeRange = {
        from: new Date(from as string),
        to: new Date(to as string)
      };
    }

    const analytics = AdvancedSearchService.getSearchAnalytics(timeRange);

    res.json({
      success: true,
      analytics,
      timeRange,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Search analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve search analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/search/visual
 * @desc Visual search using image recognition
 * @access Public
 */
router.post('/visual', async (req: Request, res: Response): Promise<void> => {
  try {
    // This endpoint would handle image uploads for visual search
    // For now, return a mock response
    
    res.json({
      success: true,
      message: 'Visual search not yet implemented',
      suggestedQuery: 'restauracja italiana',
      confidence: 0.75,
      detectedObjects: ['food', 'restaurant', 'pasta'],
      implementation: 'coming-soon'
    });

  } catch (error) {
    logger.error('❌ Visual search error:', error);
    res.status(500).json({
      success: false,
      message: 'Visual search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/trending
 * @desc Get trending search queries
 * @access Public
 */
router.get('/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = AdvancedSearchService.getSearchAnalytics();
    
    const trending = {
      queries: analytics.popularQueries.slice(0, 10),
      categories: [
        { name: 'Restauracje', count: 245, trend: '+12%' },
        { name: 'Usługi', count: 189, trend: '+8%' },
        { name: 'Sklepy', count: 156, trend: '+5%' },
        { name: 'Uroda', count: 134, trend: '+15%' },
        { name: 'Zdrowie', count: 98, trend: '+3%' }
      ],
      locations: [
        { name: 'Warszawa Centrum', count: 432, trend: '+7%' },
        { name: 'Mokotów', count: 287, trend: '+11%' },
        { name: 'Praga', count: 198, trend: '+9%' },
        { name: 'Wola', count: 176, trend: '+4%' }
      ],
      filters: analytics.filterUsage
    };

    res.json({
      success: true,
      trending,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Trending search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/search/feedback
 * @desc Submit search result feedback
 * @access Optional Auth
 */
router.post('/feedback', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, resultId, action, rating } = req.body;
    const userId = (req as any).user?.id;

    // Validate feedback data
    if (!query || !resultId || !action) {
      res.status(400).json({
        success: false,
        message: 'Query, resultId, and action are required'
      });
      return;
    }

    // Store feedback for improving search results
    logger.info('📊 Search feedback received:', {
      query,
      resultId,
      action,
      rating,
      userId,
      timestamp: new Date().toISOString()
    });

    // In a real implementation, you would store this feedback in a database
    // and use it to improve the AI ranking algorithm

    res.json({
      success: true,
      message: 'Feedback received successfully',
      thanks: 'Thank you for helping us improve search results!'
    });

  } catch (error) {
    logger.error('❌ Search feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/categories
 * @desc Get available search categories
 * @access Public
 */
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = [
      { 
        id: 'restaurants', 
        name: 'Restauracje', 
        icon: '🍽️', 
        subcategories: ['pizza', 'burger', 'sushi', 'italiana', 'polska'],
        count: 1250
      },
      { 
        id: 'retail', 
        name: 'Sklepy', 
        icon: '🛍️',
        subcategories: ['odzież', 'elektronika', 'książki', 'sport'],
        count: 890
      },
      { 
        id: 'services', 
        name: 'Usługi', 
        icon: '🔧',
        subcategories: ['naprawa', 'czyszczenie', 'transport', 'IT'],
        count: 675
      },
      { 
        id: 'healthcare', 
        name: 'Zdrowie', 
        icon: '🏥',
        subcategories: ['lekarz', 'dentysta', 'apteka', 'fizjoterapia'],
        count: 456
      },
      { 
        id: 'beauty', 
        name: 'Uroda', 
        icon: '💄',
        subcategories: ['fryzjer', 'kosmetyka', 'manicure', 'masaż'],
        count: 342
      },
      { 
        id: 'fitness', 
        name: 'Fitness', 
        icon: '💪',
        subcategories: ['siłownia', 'joga', 'pilates', 'crossfit'],
        count: 234
      },
      { 
        id: 'entertainment', 
        name: 'Rozrywka', 
        icon: '🎭',
        subcategories: ['kino', 'teatr', 'klub', 'park'],
        count: 198
      },
      { 
        id: 'automotive', 
        name: 'Motoryzacja', 
        icon: '🚗',
        subcategories: ['mechanik', 'myjnia', 'części', 'warsztat'],
        count: 167
      }
    ];

    res.json({
      success: true,
      categories,
      total: categories.reduce((sum, cat) => sum + cat.count, 0),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Categories fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;