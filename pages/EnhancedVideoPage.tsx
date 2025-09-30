import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, HeartIcon, ChatBubbleLeftIcon, ShareIcon, AdjustmentsHorizontalIcon, PlayCircleIcon, FilmIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import AdvancedVideoPlayer from '../components/AdvancedVideoPlayer';
import VideoAnalyticsDetailed from '../components/analytics/VideoAnalyticsDetailed';
import EnhancedVideoFeed from '../components/EnhancedVideoFeed';

interface VideoData {
  id: string;
  title: string;
  src: string;
  thumbnail: string;
  description: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  stats: {
    views: number;
    likes: number;
    shares: number;
  };
  uploadDate: string;
  category: string;
}

interface EnhancedVideoPageProps {
  videoId?: string;
  userId?: string;
  businessId?: string;
  isAdmin?: boolean;
}

const EnhancedVideoPage: React.FC<EnhancedVideoPageProps> = ({
  videoId = 'demo-video-1',
  userId = 'demo-user-1',
  businessId,
  isAdmin = false
}) => {
  const [selectedVideo, setSelectedVideo] = useState<string>(videoId);
  const [activeTab, setActiveTab] = useState<'player' | 'analytics' | 'feed' | 'settings'>('player');
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  // Demo video data
  const demoVideo: VideoData = {
    id: 'demo-video-1',
    title: 'Lokalna Restauracja - Najlepsze Pierogi w Krakowie!',
    src: '/videos/demo-pierogi.mp4',
    thumbnail: '/images/pierogi-thumbnail.jpg',
    description: 'Odkryj najlepsze pierogi w Krakowie! Nasza rodzinna restauracja serwuje tradycyjne polskie dania od 1985 roku. Sprawdź nasze specjały!',
    creator: {
      name: 'Restauracja U Babci',
      avatar: '/images/restaurant-avatar.jpg',
      verified: true
    },
    stats: {
      views: 12543,
      likes: 856,
      shares: 156
    },
    uploadDate: '2024-01-15',
    category: 'Gastronomia'
  };

  useEffect(() => {
    // Simulate view count increment
    const timer = setTimeout(() => {
      setViewCount(prev => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [selectedVideo]);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        author: 'Użytkownik Demo',
        timestamp: new Date().toISOString(),
        likes: 0
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const renderTabButton = (tabId: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎬 Enhanced Video Experience
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Odkryj najlepsze lokalne treści wideo z zaawansowanymi funkcjami odtwarzania i analityki
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {renderTabButton('player', <PlayCircleIcon className="w-5 h-5" />, 'Odtwarzacz')}
          {renderTabButton('analytics', <AdjustmentsHorizontalIcon className="w-5 h-5" />, 'Analityka')}
          {renderTabButton('feed', <FilmIcon className="w-5 h-5" />, 'Kanał Video')}
          {renderTabButton('settings', <SparklesIcon className="w-5 h-5" />, 'Ustawienia')}
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {activeTab === 'player' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🎥 Zaawansowany Odtwarzacz Video</h2>
              
              {/* Video Player Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Video Player */}
                <div className="lg:col-span-2">
                  <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                    <AdvancedVideoPlayer
                      videoUrl="/videos/demo-video.mp4"
                      posterUrl={demoVideo.thumbnail}
                      autoplay={false}
                      controls={true}
                    />
                  </div>
                  
                  {/* Video Info */}
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{demoVideo.title}</h3>
                    <p className="text-gray-600 mb-4">{demoVideo.description}</p>
                    
                    {/* Creator Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src="/images/restaurant-avatar.jpg"
                          alt={demoVideo.creator.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/default-avatar.png';
                          }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{demoVideo.creator.name}</span>
                            {demoVideo.creator.verified && (
                              <span className="text-blue-500">✓</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{viewCount + demoVideo.stats.views} wyświetleń</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handleLike}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                            isLiked
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {isLiked ? (
                            <HeartSolidIcon className="w-5 h-5" />
                          ) : (
                            <HeartIcon className="w-5 h-5" />
                          )}
                          <span>{demoVideo.stats.likes + (isLiked ? 1 : 0)}</span>
                        </button>
                        
                        <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <ShareIcon className="w-5 h-5" />
                          <span>{demoVideo.stats.shares}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">💬 Komentarze</h4>
                  
                  {/* Comment Form */}
                  <form onSubmit={handleComment} className="mb-6">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Dodaj komentarz..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <button
                      type="submit"
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Dodaj komentarz
                    </button>
                  </form>
                  
                  {/* Comments List */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Brak komentarzy. Bądź pierwszy!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{comment.author}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Video Analytics</h2>
              <VideoAnalyticsDetailed
                videoId={selectedVideo}
              />
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🎬 Enhanced Video Feed</h2>
              <EnhancedVideoFeed
                userId={userId}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Ustawienia Video</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Playback Settings */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 Ustawienia Odtwarzania</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jakość wideo
                      </label>
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        title="Wybierz jakość wideo"
                        aria-label="Jakość wideo"
                      >
                        <option value="auto">Automatyczna</option>
                        <option value="1080p">1080p HD</option>
                        <option value="720p">720p HD</option>
                        <option value="480p">480p</option>
                        <option value="360p">360p</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-gray-700">Autoplay następnego video</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-700">Wycisz domyślnie</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Privacy Settings */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Ustawienia Prywatności</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-gray-700">Zapisuj historię oglądania</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-gray-700">Pokazuj w rekomendacjach</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-700">Tryb incognito</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Advanced Settings */}
              <div className="mt-8 bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Zaawansowane</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">4K</div>
                    <div className="text-sm text-gray-600">Maksymalna rozdzielczość</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">60fps</div>
                    <div className="text-sm text-gray-600">Płynność odtwarzania</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">HDR</div>
                    <div className="text-sm text-gray-600">Wysoki kontrast</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            🎯 Enhanced Video Page - Zaawansowane doświadczenie wideo dla platformy Tik-in-de-buurt
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoPage;