import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdvancedSearchEngine from '../components/search/AdvancedSearchEngine';
import useAdvancedSearch from '../hooks/useAdvancedSearch';
import { MagnifyingGlassIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const { 
    results, 
    isLoading, 
    error, 
    searchHistory, 
    getTrending,
    clearHistory 
  } = useAdvancedSearch();
  
  const [trendingData, setTrendingData] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Load trending data on component mount
    const loadTrending = async () => {
      const trending = await getTrending();
      setTrendingData(trending);
    };
    
    loadTrending();
  }, [getTrending]);

  const handleSearch = (query: any) => {
    console.log('Search query:', query);
    // Handle search logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-lg">
                <MagnifyingGlassIcon className="w-16 h-16" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t('search.title', 'Zaawansowane Wyszukiwanie')}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              {t('search.subtitle', 'Znajdź dokładnie to, czego szukasz dzięki AI-powered wyszukiwarce z rozpoznawaniem głosu, obrazów i naturalnego języka')}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-2xl font-bold">10,000+</div>
                <div className="text-white/80">Firm i usług</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-2xl font-bold">50+</div>
                <div className="text-white/80">Kategorii</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-white/80">Dostępność</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 -mt-16 relative z-10">
          <AdvancedSearchEngine onSearch={handleSearch} />
        </div>

        {/* Search Results or Welcome Content */}
        {results.length > 0 ? (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Wyniki wyszukiwania ({results.length})
              </h2>
              
              {isLoading && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  Wyszukiwanie...
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="text-red-600 text-sm">
                    ❌ {error}
                  </div>
                </div>
              </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, index) => (
                <div 
                  key={result.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  {result.image && (
                    <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={result.image} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {result.title}
                      </h3>
                      {result.verified && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          ✓ Zweryfikowane
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {result.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {result.category}
                      </span>
                      <span>📍 {result.location.distance?.toFixed(1)}km</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 font-medium">{result.rating}</span>
                        <span className="text-gray-500 text-sm ml-1">
                          ({result.reviewCount})
                        </span>
                      </div>
                      
                      {result.price && (
                        <span className="font-semibold text-green-600">
                          {result.price.range}
                        </span>
                      )}
                    </div>
                    
                    {result.highlights && result.highlights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          🔍 {result.highlights.join(' • ')}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        Zobacz szczegóły
                      </button>
                      <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        💖
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Welcome Content when no results */
          <div className="mt-12">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Historia wyszukiwania
                  </h3>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Wyczyść historię
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchHistory.slice(0, 6).map((search, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {search.text}
                      </div>
                      {search.category && (
                        <div className="text-xs text-gray-500 mt-1">
                          📂 {search.category}
                        </div>
                      )}
                      {search.location && (
                        <div className="text-xs text-gray-500">
                          📍 {search.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Section */}
            {trendingData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Popular Queries */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Popularne wyszukiwania
                  </h3>
                  <div className="space-y-3">
                    {trendingData.queries?.slice(0, 5).map((query: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600">
                          {query.query}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {query.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📂 Popularne kategorie
                  </h3>
                  <div className="space-y-3">
                    {trendingData.categories?.slice(0, 5).map((category: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600">
                          {category.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-600">{category.trend}</span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {category.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Locations */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📍 Popularne lokalizacje
                  </h3>
                  <div className="space-y-3">
                    {trendingData.locations?.slice(0, 5).map((location: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600">
                          {location.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-600">{location.trend}</span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {location.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Feature Highlights */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎤</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Wyszukiwanie głosowe
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Powiedz co szukasz - nasze AI Cię zrozumie
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📷</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Wyszukiwanie wizualne
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Zrób zdjęcie - znajdziemy podobne usługi
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🧠</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Naturalny język
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Pisz naturalnie - "fryzjer blisko metra"
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Precyzyjne filtry
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Cena, oceny, odległość i wiele więcej
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;