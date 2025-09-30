import { logger } from '../utils/logger';

export interface SearchQuery {
  text?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  radius?: number;
  category?: string[];
  priceRange?: [number, number];
  rating?: number;
  openNow?: boolean;
  hasOffers?: boolean;
  videoContent?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'distance' | 'rating' | 'popularity' | 'newest';
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'business' | 'video' | 'event' | 'offer';
  score: number;
  distance?: number;
  business?: {
    id: string;
    name: string;
    category: string;
    rating: number;
    address: string;
    phone?: string;
    website?: string;
    isOpen: boolean;
    hasOffers: boolean;
    priceRange: string;
  };
  media?: {
    thumbnail: string;
    type: 'image' | 'video';
    duration?: number;
  };
  location?: {
    lat: number;
    lng: number;
  };
  relevanceReason: string;
  createdAt: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'business' | 'category' | 'location' | 'query';
  confidence: number;
  icon?: string;
  popularity?: number;
}

export interface SearchAnalytics {
  query: string;
  resultsCount: number;
  clickThrough: number;
  userId?: string;
  timestamp: string;
  filters: SearchQuery;
  sessionId: string;
}

class AdvancedSearchService {
  private static searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private static suggestionCache = new Map<string, { suggestions: SearchSuggestion[]; timestamp: number }>();
  private static searchAnalytics: SearchAnalytics[] = [];
  private static popularQueries = new Map<string, number>();
  
  // Cache duration (5 minutes)
  private static CACHE_DURATION = 5 * 60 * 1000;

  /**
   * Main search method with AI-powered ranking
   */
  static async search(query: SearchQuery, userId?: string): Promise<{
    results: SearchResult[];
    total: number;
    suggestions: SearchSuggestion[];
    analytics: {
      processingTime: number;
      filtersApplied: number;
      aiEnhanced: boolean;
    };
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('🔍 Advanced search initiated:', { query, userId });

      // Generate cache key
      const cacheKey = this.generateCacheKey(query);
      
      // Check cache first
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        logger.info('📦 Returning cached search results');
        return {
          results: cached.results,
          total: cached.results.length,
          suggestions: await this.generateSuggestions(query.text || ''),
          analytics: {
            processingTime: Date.now() - startTime,
            filtersApplied: this.countAppliedFilters(query),
            aiEnhanced: true
          }
        };
      }

      // Perform AI-enhanced search
      const results = await this.performAdvancedSearch(query, userId);
      
      // Cache results
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });

      // Generate suggestions
      const suggestions = await this.generateSuggestions(query.text || '');

      // Track analytics
      if (query.text) {
        this.trackSearchAnalytics(query, results.length, userId);
      }

      const processingTime = Date.now() - startTime;
      logger.info(`🎯 Search completed in ${processingTime}ms`, { 
        resultsCount: results.length,
        filtersApplied: this.countAppliedFilters(query)
      });

      return {
        results,
        total: results.length,
        suggestions,
        analytics: {
          processingTime,
          filtersApplied: this.countAppliedFilters(query),
          aiEnhanced: true
        }
      };

    } catch (error) {
      logger.error('❌ Search error:', error);
      throw error;
    }
  }

  /**
   * Perform advanced search with AI ranking
   */
  private static async performAdvancedSearch(query: SearchQuery, userId?: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Mock data - replace with actual database queries
    const mockBusinesses = [
      {
        id: 'b1',
        name: 'Pizzeria Italiana',
        category: 'restaurants',
        rating: 4.5,
        address: 'ul. Główna 15, Warszawa',
        phone: '+48 123 456 789',
        isOpen: true,
        hasOffers: true,
        priceRange: 'moderate',
        location: { lat: 52.2297, lng: 21.0122 },
        description: 'Authentic Italian pizza with fresh ingredients'
      },
      {
        id: 'b2', 
        name: 'TechRepair Pro',
        category: 'services',
        rating: 4.8,
        address: 'ul. Nowa 22, Warszawa',
        phone: '+48 987 654 321',
        isOpen: false,
        hasOffers: false,
        priceRange: 'expensive',
        location: { lat: 52.2319, lng: 21.0067 },
        description: 'Professional computer and smartphone repair'
      }
    ];

    // Apply filters and search logic
    let filteredResults = mockBusinesses;

    // Text search with NLP
    if (query.text) {
      filteredResults = this.applyTextSearch(filteredResults, query.text);
    }

    // Category filter
    if (query.category && query.category.length > 0) {
      filteredResults = filteredResults.filter(b => 
        query.category!.includes(b.category)
      );
    }

    // Location/distance filter
    if (query.location && query.radius) {
      filteredResults = this.applyLocationFilter(filteredResults, query.location, query.radius);
    }

    // Rating filter
    if (query.rating) {
      filteredResults = filteredResults.filter(b => b.rating >= query.rating!);
    }

    // Open now filter
    if (query.openNow) {
      filteredResults = filteredResults.filter(b => b.isOpen);
    }

    // Has offers filter
    if (query.hasOffers) {
      filteredResults = filteredResults.filter(b => b.hasOffers);
    }

    // Price range filter
    if (query.priceRange) {
      filteredResults = this.applyPriceFilter(filteredResults, query.priceRange);
    }

    // Convert to SearchResult format and apply AI ranking
    for (const business of filteredResults) {
      const distance = query.location ? 
        this.calculateDistance(query.location, business.location) : undefined;

      const score = await this.calculateRelevanceScore(business, query, userId, distance);

      results.push({
        id: business.id,
        title: business.name,
        description: business.description,
        type: 'business',
        score,
        distance,
        business: {
          id: business.id,
          name: business.name,
          category: business.category,
          rating: business.rating,
          address: business.address,
          phone: business.phone,
          isOpen: business.isOpen,
          hasOffers: business.hasOffers,
          priceRange: business.priceRange
        },
        location: business.location,
        relevanceReason: this.generateRelevanceReason(business, query, score),
        createdAt: new Date().toISOString()
      });
    }

    // Sort by relevance score and selected sorting option
    return this.sortResults(results, query.sortBy || 'relevance');
  }

  /**
   * Apply text search with NLP
   */
  private static applyTextSearch(businesses: any[], searchText: string): any[] {
    const normalizedSearch = searchText.toLowerCase();
    
    return businesses.filter(business => {
      const searchableText = `
        ${business.name} 
        ${business.category} 
        ${business.description} 
        ${business.address}
      `.toLowerCase();

      // Basic text matching (can be enhanced with NLP)
      return searchableText.includes(normalizedSearch);
    });
  }

  /**
   * Apply location/distance filtering
   */
  private static applyLocationFilter(
    businesses: any[], 
    userLocation: { lat: number; lng: number }, 
    radiusMeters: number
  ): any[] {
    return businesses.filter(business => {
      const distance = this.calculateDistance(userLocation, business.location);
      return distance <= radiusMeters;
    });
  }

  /**
   * Apply price range filtering
   */
  private static applyPriceFilter(businesses: any[], priceRange: [number, number]): any[] {
    const priceMap = {
      'cheap': 25,
      'moderate': 50,
      'expensive': 100,
      'luxury': 200
    };

    return businesses.filter(business => {
      const businessPrice = priceMap[business.priceRange as keyof typeof priceMap] || 50;
      return businessPrice >= priceRange[0] && businessPrice <= priceRange[1];
    });
  }

  /**
   * Calculate AI-powered relevance score
   */
  private static async calculateRelevanceScore(
    business: any,
    query: SearchQuery,
    userId?: string,
    distance?: number
  ): Promise<number> {
    let score = 0;

    // Base score from business rating (30%)
    score += (business.rating / 5) * 30;

    // Text relevance score (25%)
    if (query.text) {
      const textScore = this.calculateTextRelevance(business, query.text);
      score += textScore * 25;
    }

    // Distance score (20%)
    if (distance !== undefined) {
      const distanceScore = Math.max(0, 100 - (distance / 1000) * 10); // Penalty for distance
      score += (distanceScore / 100) * 20;
    }

    // Category match score (15%)
    if (query.category?.includes(business.category)) {
      score += 15;
    }

    // Special conditions (10%)
    if (query.openNow && business.isOpen) score += 5;
    if (query.hasOffers && business.hasOffers) score += 5;

    // User personalization (can be enhanced with ML)
    if (userId) {
      const personalizationScore = await this.getPersonalizationScore(business, userId);
      score += personalizationScore * 0.1;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate text relevance using simple NLP
   */
  private static calculateTextRelevance(business: any, searchText: string): number {
    const searchTerms = searchText.toLowerCase().split(' ');
    const businessText = `${business.name} ${business.description} ${business.category}`.toLowerCase();
    
    let matches = 0;
    let totalScore = 0;

    searchTerms.forEach(term => {
      if (businessText.includes(term)) {
        matches++;
        // Exact name match gets higher score
        if (business.name.toLowerCase().includes(term)) {
          totalScore += 3;
        } else if (business.category.toLowerCase().includes(term)) {
          totalScore += 2;
        } else {
          totalScore += 1;
        }
      }
    });

    return (matches / searchTerms.length) * (totalScore / searchTerms.length) * 100;
  }

  /**
   * Get personalization score based on user preferences
   */
  private static async getPersonalizationScore(business: any, userId: string): Promise<number> {
    // Mock personalization - replace with actual user preference analysis
    return Math.random() * 10; // 0-10 personalization boost
  }

  /**
   * Generate relevance reason for users
   */
  private static generateRelevanceReason(business: any, query: SearchQuery, score: number): string {
    if (score > 90) return "Perfect match for your search";
    if (score > 80) return "Highly relevant based on your criteria";
    if (score > 70) return `Popular ${business.category} in your area`;
    if (score > 60) return "Good match for your search";
    if (business.hasOffers) return "Has special offers available";
    if (business.isOpen) return "Currently open";
    return "Matches your search criteria";
  }

  /**
   * Sort results based on selected criteria
   */
  private static sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    switch (sortBy) {
      case 'distance':
        return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'rating':
        return results.sort((a, b) => (b.business?.rating || 0) - (a.business?.rating || 0));
      case 'popularity':
        return results.sort((a, b) => b.score - a.score);
      case 'newest':
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'relevance':
      default:
        return results.sort((a, b) => b.score - a.score);
    }
  }

  /**
   * Generate AI-powered search suggestions
   */
  static async generateSuggestions(searchText: string): Promise<SearchSuggestion[]> {
    if (!searchText || searchText.length < 2) {
      return this.getPopularSuggestions();
    }

    const cacheKey = `suggestions_${searchText.toLowerCase()}`;
    const cached = this.suggestionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.suggestions;
    }

    const suggestions: SearchSuggestion[] = [];

    // Business name suggestions
    suggestions.push({
      id: `biz_${Date.now()}`,
      text: `${searchText} - restauracja`,
      type: 'business',
      confidence: 0.9,
      icon: '🍽️'
    });

    // Category suggestions
    if (searchText.toLowerCase().includes('pizza')) {
      suggestions.push({
        id: `cat_${Date.now()}`,
        text: 'Pizzerie w pobliżu',
        type: 'category',
        confidence: 0.8,
        icon: '🍕'
      });
    }

    // Location-based suggestions
    suggestions.push({
      id: `loc_${Date.now()}`,
      text: `${searchText} w pobliżu`,
      type: 'location',
      confidence: 0.7,
      icon: '📍'
    });

    // Query completions with AI
    const aiSuggestions = await this.generateAISuggestions(searchText);
    suggestions.push(...aiSuggestions);

    // Cache suggestions
    this.suggestionCache.set(cacheKey, {
      suggestions,
      timestamp: Date.now()
    });

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  /**
   * Generate AI-powered query suggestions
   */
  private static async generateAISuggestions(searchText: string): Promise<SearchSuggestion[]> {
    // Mock AI suggestions - replace with actual AI service
    const aiSuggestions = [
      `Najlepsze ${searchText} w okolicy`,
      `${searchText} z dostawą`,
      `Tanie ${searchText} wysokiej jakości`,
      `${searchText} otwarte teraz`
    ];

    return aiSuggestions.map((text, index) => ({
      id: `ai_${Date.now()}_${index}`,
      text,
      type: 'query' as const,
      confidence: 0.6 + (0.1 * (4 - index)),
      icon: '🤖'
    }));
  }

  /**
   * Get popular search suggestions
   */
  private static getPopularSuggestions(): SearchSuggestion[] {
    const popular = [
      { text: 'Pizza', icon: '🍕', popularity: 95 },
      { text: 'Restauracje', icon: '🍽️', popularity: 87 },
      { text: 'Fryzjer', icon: '✂️', popularity: 78 },
      { text: 'Sklepy', icon: '🛍️', popularity: 72 },
      { text: 'Apteka', icon: '💊', popularity: 68 }
    ];

    return popular.map((item, index) => ({
      id: `popular_${index}`,
      text: item.text,
      type: 'category',
      confidence: item.popularity / 100,
      icon: item.icon,
      popularity: item.popularity
    }));
  }

  /**
   * Track search analytics
   */
  private static trackSearchAnalytics(query: SearchQuery, resultsCount: number, userId?: string): void {
    const analytics: SearchAnalytics = {
      query: query.text || '',
      resultsCount,
      clickThrough: 0,
      userId,
      timestamp: new Date().toISOString(),
      filters: query,
      sessionId: this.generateSessionId()
    };

    this.searchAnalytics.push(analytics);
    
    // Update popular queries
    if (query.text) {
      const currentCount = this.popularQueries.get(query.text) || 0;
      this.popularQueries.set(query.text, currentCount + 1);
    }

    // Keep only last 1000 analytics entries
    if (this.searchAnalytics.length > 1000) {
      this.searchAnalytics = this.searchAnalytics.slice(-1000);
    }
  }

  /**
   * Natural Language Processing for search queries
   */
  static parseNaturalLanguageQuery(query: string): SearchQuery {
    const lowerQuery = query.toLowerCase();
    const result: SearchQuery = { text: query };

    // Intent detection
    if (lowerQuery.includes('otwarte teraz') || lowerQuery.includes('open now')) {
      result.openNow = true;
    }

    if (lowerQuery.includes('w pobliżu') || lowerQuery.includes('near me') || lowerQuery.includes('blisko')) {
      result.radius = 2000; // 2km for "near me"
    }

    if (lowerQuery.includes('promocje') || lowerQuery.includes('oferty') || lowerQuery.includes('rabat')) {
      result.hasOffers = true;
    }

    // Price indicators
    if (lowerQuery.includes('tanie') || lowerQuery.includes('tanio') || lowerQuery.includes('niedroga')) {
      result.priceRange = [0, 50];
    } else if (lowerQuery.includes('drogie') || lowerQuery.includes('luksusowe') || lowerQuery.includes('premium')) {
      result.priceRange = [100, 1000];
    }

    // Quality indicators
    if (lowerQuery.includes('najlepsze') || lowerQuery.includes('wysoka ocena') || lowerQuery.includes('polecane')) {
      result.rating = 4;
    }

    // Category detection
    const categoryMap = {
      'pizz': ['restaurants'],
      'restaur': ['restaurants'],
      'jedzenie': ['restaurants'],
      'sklep': ['retail'],
      'fryzjer': ['beauty'],
      'uroda': ['beauty'],
      'fitness': ['fitness'],
      'siłownia': ['fitness'],
      'mechanik': ['automotive'],
      'naprawa': ['services'],
      'lekarz': ['healthcare'],
      'dentysta': ['healthcare']
    };

    for (const [keyword, categories] of Object.entries(categoryMap)) {
      if (lowerQuery.includes(keyword)) {
        result.category = categories;
        break;
      }
    }

    return result;
  }

  /**
   * Utility methods
   */
  private static generateCacheKey(query: SearchQuery): string {
    return JSON.stringify(query);
  }

  private static generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static countAppliedFilters(query: SearchQuery): number {
    let count = 0;
    if (query.category && query.category.length > 0) count++;
    if (query.location) count++;
    if (query.priceRange && (query.priceRange[0] > 0 || query.priceRange[1] < 1000)) count++;
    if (query.rating && query.rating > 0) count++;
    if (query.openNow) count++;
    if (query.hasOffers) count++;
    if (query.videoContent) count++;
    return count;
  }

  private static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get search analytics
   */
  static getSearchAnalytics(timeRange?: { from: Date; to: Date }): {
    totalSearches: number;
    popularQueries: Array<{ query: string; count: number }>;
    averageResultsPerSearch: number;
    filterUsage: Record<string, number>;
  } {
    let analytics = this.searchAnalytics;
    
    if (timeRange) {
      analytics = analytics.filter(a => {
        const timestamp = new Date(a.timestamp);
        return timestamp >= timeRange.from && timestamp <= timeRange.to;
      });
    }

    const popularQueriesArray = Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    const totalResults = analytics.reduce((sum, a) => sum + a.resultsCount, 0);
    const averageResults = analytics.length > 0 ? totalResults / analytics.length : 0;

    const filterUsage: Record<string, number> = {};
    analytics.forEach(a => {
      if (a.filters.category) filterUsage.category = (filterUsage.category || 0) + 1;
      if (a.filters.location) filterUsage.location = (filterUsage.location || 0) + 1;
      if (a.filters.priceRange) filterUsage.priceRange = (filterUsage.priceRange || 0) + 1;
      if (a.filters.rating) filterUsage.rating = (filterUsage.rating || 0) + 1;
      if (a.filters.openNow) filterUsage.openNow = (filterUsage.openNow || 0) + 1;
      if (a.filters.hasOffers) filterUsage.hasOffers = (filterUsage.hasOffers || 0) + 1;
    });

    return {
      totalSearches: analytics.length,
      popularQueries: popularQueriesArray,
      averageResultsPerSearch: averageResults,
      filterUsage
    };
  }
}

export { AdvancedSearchService };