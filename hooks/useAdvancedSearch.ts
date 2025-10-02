import { useState, useEffect, useCallback } from 'react';

export interface SearchQuery {
  text?: string;
  category?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  distance?: number;
  openNow?: boolean;
  verified?: boolean;
  hasOffers?: boolean;
  sortBy?: 'relevance' | 'distance' | 'rating' | 'price' | 'newest';
  language?: string;
}

export interface SearchResult {
  id: string;
  type: 'business' | 'freelancer' | 'event' | 'ad';
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: [number, number];
    distance?: number;
  };
  rating: number;
  reviewCount: number;
  price?: {
    range: string;
    currency: string;
  };
  image?: string;
  verified: boolean;
  openNow?: boolean;
  relevanceScore: number;
  highlights?: string[];
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    totalCount: number;
    query: SearchQuery;
    suggestions?: string[];
    filters?: {
      categories: Array<{ name: string; count: number }>;
      locations: Array<{ name: string; count: number }>;
      priceRanges: Array<{ range: string; count: number }>;
    };
    analytics?: {
      searchTime: number;
      resultsSources: string[];
    };
  };
  query: SearchQuery;
  timestamp: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'category' | 'location' | 'business';
  confidence: number;
  icon?: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  avgResponseTime: number;
  popularQueries: Array<{ query: string; count: number }>;
  popularCategories: Array<{ category: string; count: number }>;
  filterUsage: Record<string, number>;
  timeDistribution: Array<{ hour: number; count: number }>;
  userBehavior: {
    clickThroughRate: number;
    avgResultsViewed: number;
    refinementRate: number;
  };
}

export const useAdvancedSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('tik_search_history');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback((query: SearchQuery) => {
    const newHistory = [query, ...searchHistory.filter(h => 
      JSON.stringify(h) !== JSON.stringify(query)
    )].slice(0, 10); // Keep last 10 searches
    
    setSearchHistory(newHistory);
    localStorage.setItem('tik_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Perform advanced search
  const search = useCallback(async (query: SearchQuery): Promise<SearchResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setResults(data.data.results);
        setTotalResults(data.data.totalCount);
        saveToHistory(query);
        
        // Track search analytics
        trackSearchEvent('search_performed', {
          query: query.text,
          category: query.category,
          filters: Object.keys(query).filter(k => k !== 'text' && query[k as keyof SearchQuery])
        });
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!query.trim()) {
      // Return popular/recent suggestions
      return [
        { text: 'Restauracje w pobliżu', type: 'query', confidence: 0.9, icon: '🍽️' },
        { text: 'Fryzjer', type: 'category', confidence: 0.8, icon: '✂️' },
        { text: 'Warszawa Centrum', type: 'location', confidence: 0.7, icon: '📍' },
        { text: 'Mechanik samochodowy', type: 'query', confidence: 0.6, icon: '🔧' }
      ];
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
        return data.suggestions;
      }
      
      return [];
    } catch (err) {
      console.warn('Suggestions error:', err);
      return [];
    }
  }, []);

  // Parse natural language query
  const parseNaturalLanguage = useCallback(async (query: string): Promise<SearchQuery | null> => {
    try {
      const response = await fetch('/api/search/nlp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('NLP parsing failed');
      }

      const data = await response.json();
      
      if (data.success) {
        return data.parsed;
      }
      
      return null;
    } catch (err) {
      console.warn('NLP parsing error:', err);
      return null;
    }
  }, []);

  // Get trending searches
  const getTrending = useCallback(async () => {
    try {
      console.log('[TRENDING] Fetching trending data...');
      const API_BASE_URL = (window as any).VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/search/trending`);
      
      if (!response.ok) {
        console.warn(`[TRENDING] HTTP ${response.status} ${response.statusText}`);
        return { items: [] }; // Return empty array instead of null
      }

      // Safe JSON parse - check content-type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn(`[TRENDING] Unexpected content-type: ${contentType} - returning empty`);
        return { items: [] };
      }

      const data = await response.json();
      console.log('[TRENDING] ✅ Data received:', data);
      
      // Handle both response formats
      if (data.items) {
        // New mock format: { items: [...] }
        return data;
      } else if (data.success && data.trending) {
        // Old format: { success, trending: {...} }
        return data.trending;
      }
      
      console.warn('[TRENDING] Empty or invalid structure - returning empty');
      return { items: [] };
    } catch (err) {
      console.warn('[TRENDING] ⚠️ empty due to fetch/parse error:', err);
      return { items: [] }; // Always return safe fallback
    }
  }, []);

  // Get search analytics (admin only)
  const getAnalytics = useCallback(async (timeRange?: { from: Date; to: Date }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      let url = '/api/search/analytics';
      if (timeRange) {
        const params = new URLSearchParams({
          from: timeRange.from.toISOString(),
          to: timeRange.to.toISOString()
        });
        url += `?${params}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
        return data.analytics;
      }
      
      return null;
    } catch (err) {
      console.warn('Analytics error:', err);
      return null;
    }
  }, []);

  // Submit search feedback
  const submitFeedback = useCallback(async (
    query: string,
    resultId: string,
    action: 'click' | 'like' | 'dislike' | 'report',
    rating?: number
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/search/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          query,
          resultId,
          action,
          rating
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const data = await response.json();
      
      // Track feedback event
      trackSearchEvent('search_feedback', {
        query,
        resultId,
        action,
        rating
      });

      return data.success;
    } catch (err) {
      console.warn('Feedback error:', err);
      return false;
    }
  }, []);

  // Clear search results
  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setError(null);
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('tik_search_history');
  }, []);

  return {
    // State
    results,
    suggestions,
    analytics,
    isLoading,
    error,
    searchHistory,
    totalResults,
    
    // Actions
    search,
    getSuggestions,
    parseNaturalLanguage,
    getTrending,
    getAnalytics,
    submitFeedback,
    clearResults,
    clearHistory
  };
};

// Helper function to track search events
const trackSearchEvent = (event: string, data: any) => {
  // This could be enhanced with analytics services like Google Analytics
  console.log(`🔍 Search Event: ${event}`, data);
  
  // Store in localStorage for basic analytics
  const events = JSON.parse(localStorage.getItem('tik_search_events') || '[]');
  events.push({
    event,
    data,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 100 events
  localStorage.setItem('tik_search_events', JSON.stringify(events.slice(-100)));
};

export default useAdvancedSearch;