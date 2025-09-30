import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MagnifyingGlassIcon,
  MicrophoneIcon,
  CameraIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  TagIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export interface AdvancedSearchQuery {
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
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'business' | 'category' | 'location' | 'query';
  confidence: number;
  icon?: string;
}

interface AdvancedSearchEngineProps {
  onSearch: (query: AdvancedSearchQuery) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  initialQuery?: string;
  showFilters?: boolean;
  enableVoiceSearch?: boolean;
  enableVisualSearch?: boolean;
  enableAI?: boolean;
}

const AdvancedSearchEngine: React.FC<AdvancedSearchEngineProps> = ({
  onSearch,
  onSuggestionClick,
  placeholder = "Szukaj biznesów, kategorii, lokalizacji...",
  initialQuery = "",
  showFilters = true,
  enableVoiceSearch = true,
  enableVisualSearch = true,
  enableAI = true
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState<AdvancedSearchQuery>({
    text: initialQuery,
    radius: 5000, // 5km default
    priceRange: [0, 1000],
    rating: 0
  });
  
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Categories for filtering
  const categories = [
    { id: 'restaurants', name: 'Restauracje', icon: '🍽️' },
    { id: 'retail', name: 'Sklepy', icon: '🛍️' },
    { id: 'services', name: 'Usługi', icon: '🔧' },
    { id: 'healthcare', name: 'Zdrowie', icon: '🏥' },
    { id: 'entertainment', name: 'Rozrywka', icon: '🎭' },
    { id: 'fitness', name: 'Fitness', icon: '💪' },
    { id: 'beauty', name: 'Uroda', icon: '💄' },
    { id: 'automotive', name: 'Motoryzacja', icon: '🚗' }
  ];

  // Load search history on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.text && query.text.length > 2) {
      debounceTimeout.current = setTimeout(() => {
        fetchSuggestions(query.text!);
        if (enableAI) {
          generateAISuggestions(query.text!);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setAiSuggestions([]);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query.text, enableAI]);

  const fetchSuggestions = async (searchText: string) => {
    try {
      // Mock API call - replace with actual API
      const mockSuggestions: SearchSuggestion[] = [
        {
          id: '1',
          text: `${searchText} - pizzeria`,
          type: 'business',
          confidence: 0.9,
          icon: '🍕'
        },
        {
          id: '2',
          text: `${searchText} w pobliżu`,
          type: 'location',
          confidence: 0.8,
          icon: '📍'
        },
        {
          id: '3',
          text: `Otwarte teraz - ${searchText}`,
          type: 'query',
          confidence: 0.7,
          icon: '🕐'
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const generateAISuggestions = async (searchText: string) => {
    try {
      // Mock AI suggestions - replace with actual AI service
      const aiSuggestions = [
        `Najlepsze ${searchText} w okolicy`,
        `${searchText} z dostawą`,
        `Tanie ${searchText} z wysoką oceną`,
        `${searchText} otwarte 24/7`
      ];
      
      setAiSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const handleSearch = useCallback(() => {
    if (query.text) {
      // Add to search history
      const newHistory = [query.text, ...searchHistory.filter(h => h !== query.text)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }

    onSearch(query);
    setShowSuggestions(false);
  }, [query, onSearch, searchHistory]);

  const handleVoiceSearch = () => {
    if (!enableVoiceSearch || !('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsVoiceRecording(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(prev => ({ ...prev, text: transcript }));
      setIsVoiceRecording(false);
      
      // Parse natural language query with AI
      parseNaturalLanguageQuery(transcript);
    };

    recognition.onerror = () => {
      setIsVoiceRecording(false);
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
    };

    recognition.start();
  };

  const parseNaturalLanguageQuery = (text: string) => {
    const lowerText = text.toLowerCase();
    const newQuery = { ...query, text };

    // Parse intent from natural language
    if (lowerText.includes('otwarte teraz') || lowerText.includes('open now')) {
      newQuery.openNow = true;
    }
    
    if (lowerText.includes('w pobliżu') || lowerText.includes('near me')) {
      newQuery.radius = 2000; // 2km for "near me"
    }
    
    if (lowerText.includes('promocje') || lowerText.includes('oferty')) {
      newQuery.hasOffers = true;
    }

    // Extract price indicators
    if (lowerText.includes('tanie') || lowerText.includes('tanio')) {
      newQuery.priceRange = [0, 50];
    } else if (lowerText.includes('drogie') || lowerText.includes('luksusowe')) {
      newQuery.priceRange = [100, 1000];
    }

    // Extract rating indicators
    if (lowerText.includes('najlepsze') || lowerText.includes('wysoka ocena')) {
      newQuery.rating = 4;
    }

    // Extract categories
    categories.forEach(category => {
      if (lowerText.includes(category.name.toLowerCase())) {
        newQuery.category = [category.id];
      }
    });

    setQuery(newQuery);
  };

  const handleVisualSearch = () => {
    if (!enableVisualSearch) return;
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Mock visual search - replace with actual AI image recognition
      const mockResult = "Rozpoznano: restauracja, pizza, wnętrze";
      setQuery(prev => ({ ...prev, text: mockResult }));
      
      // You would typically upload the image to an AI service here
      console.log('Visual search for image:', file.name);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setQuery(prev => {
      const currentCategories = prev.category || [];
      const newCategories = currentCategories.includes(categoryId)
        ? currentCategories.filter(c => c !== categoryId)
        : [...currentCategories, categoryId];
      
      return { ...prev, category: newCategories };
    });
  };

  const clearFilters = () => {
    setQuery(prev => ({
      text: prev.text,
      radius: 5000,
      priceRange: [0, 1000],
      rating: 0
    }));
  };

  const appliedFiltersCount = 
    (query.category?.length || 0) +
    (query.openNow ? 1 : 0) +
    (query.hasOffers ? 1 : 0) +
    (query.videoContent ? 1 : 0) +
    (query.rating && query.rating > 0 ? 1 : 0) +
    (query.priceRange && (query.priceRange[0] > 0 || query.priceRange[1] < 1000) ? 1 : 0);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              className="w-full pl-12 pr-4 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
              placeholder={placeholder}
              value={query.text || ''}
              onChange={(e) => setQuery(prev => ({ ...prev, text: e.target.value }))}
              onFocus={() => setShowSuggestions(true)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 px-4">
            {enableVoiceSearch && (
              <button
                onClick={handleVoiceSearch}
                className={`p-2 rounded-lg transition-colors ${
                  isVoiceRecording 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Voice Search"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            )}

            {enableVisualSearch && (
              <button
                onClick={handleVisualSearch}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                title="Visual Search"
              >
                <CameraIcon className="h-5 w-5" />
              </button>
            )}

            {showFilters && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2 rounded-lg transition-colors relative ${
                  showAdvancedFilters 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Advanced Filters"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                {appliedFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {appliedFiltersCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Szukaj
            </button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (query.text || searchHistory.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            {/* AI Suggestions */}
            {enableAI && aiSuggestions.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <SparklesIcon className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">AI Suggestions</span>
                </div>
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(prev => ({ ...prev, text: suggestion }));
                      setShowSuggestions(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Regular Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Suggestions</div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      setQuery(prev => ({ ...prev, text: suggestion.text }));
                      setShowSuggestions(false);
                      onSuggestionClick?.(suggestion);
                    }}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                    <span className="text-xs text-gray-500 ml-auto">{Math.round(suggestion.confidence * 100)}%</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="p-3">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recent Searches</div>
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(prev => ({ ...prev, text: historyItem }));
                      setShowSuggestions(false);
                    }}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span>{historyItem}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label="Close advanced filters"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <TagIcon className="inline h-4 w-4 mr-1" />
                Categories
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      query.category?.includes(category.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                Distance (km)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={(query.radius || 5000) / 1000}
                  onChange={(e) => setQuery(prev => ({ ...prev, radius: parseInt(e.target.value) * 1000 }))}
                  className="w-full"
                  aria-label="Search radius in kilometers"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {((query.radius || 5000) / 1000)} km
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <CurrencyDollarIcon className="inline h-4 w-4 mr-1" />
                Price Range (PLN)
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={query.priceRange?.[0] || ''}
                    onChange={(e) => setQuery(prev => ({ 
                      ...prev, 
                      priceRange: [parseInt(e.target.value) || 0, prev.priceRange?.[1] || 1000] 
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={query.priceRange?.[1] || ''}
                    onChange={(e) => setQuery(prev => ({ 
                      ...prev, 
                      priceRange: [prev.priceRange?.[0] || 0, parseInt(e.target.value) || 1000] 
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <StarIcon className="inline h-4 w-4 mr-1" />
                Minimum Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setQuery(prev => ({ ...prev, rating: star }))}
                    className={`p-1 rounded ${
                      (query.rating || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    aria-label={`Set minimum rating to ${star} stars`}
                  >
                    <StarIcon className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Special Filters */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Special Filters
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'openNow', label: 'Open Now', icon: '🕐' },
                  { key: 'hasOffers', label: 'Has Offers', icon: '💰' },
                  { key: 'videoContent', label: 'Video Content', icon: '🎥' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setQuery(prev => ({ 
                      ...prev, 
                      [filter.key]: !(prev as any)[filter.key] 
                    }))}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      (query as any)[filter.key]
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Apply Filters ({appliedFiltersCount} active)
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for visual search */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Upload image for visual search"
      />
    </div>
  );
};

export default AdvancedSearchEngine;