import { VideoAnalyticsService, VideoMetrics } from './videoAnalyticsService';
import { logger } from '../utils/logger';

export interface VideoRecommendation {
  videoId: string;
  title: string;
  businessName: string;
  category: string;
  thumbnailUrl: string;
  duration: number;
  score: number;
  reason: string;
  metrics: {
    views: number;
    rating: number;
    engagementRate: number;
  };
}

export interface UserVideoProfile {
  userId: string;
  preferences: {
    categories: Record<string, number>;
    avgWatchTime: number;
    preferredDuration: number;
    engagementPatterns: string[];
  };
  history: {
    watchedVideos: string[];
    likedVideos: string[];
    sharedVideos: string[];
    completedVideos: string[];
  };
}

class VideoRecommendationService {
  private static userProfiles: Map<string, UserVideoProfile> = new Map();
  private static videoDatabase: Map<string, any> = new Map();
  
  /**
   * Dodaje wideo do bazy danych dla rekomendacji
   */
  static addVideoToDatabase(video: {
    id: string;
    title: string;
    businessName: string;
    category: string;
    thumbnailUrl: string;
    duration: number;
    rating?: number;
  }): void {
    this.videoDatabase.set(video.id, video);
  }

  /**
   * Generuje rekomendacje dla użytkownika
   */
  static async getRecommendationsForUser(
    userId: string, 
    limit: number = 10,
    excludeWatched: boolean = true
  ): Promise<VideoRecommendation[]> {
    try {
      const userProfile = this.getUserProfile(userId);
      const allVideos = Array.from(this.videoDatabase.values());
      
      const recommendations: VideoRecommendation[] = [];
      
      for (const video of allVideos) {
        if (excludeWatched && userProfile.history.watchedVideos.includes(video.id)) {
          continue;
        }
        
        const score = await this.calculateRecommendationScore(video, userProfile);
        const metrics = await VideoAnalyticsService.getVideoMetrics(video.id);
        
        recommendations.push({
          videoId: video.id,
          title: video.title,
          businessName: video.businessName,
          category: video.category,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          score,
          reason: this.getRecommendationReason(video, userProfile, score),
          metrics: {
            views: metrics?.totalViews || 0,
            rating: video.rating || 0,
            engagementRate: metrics?.engagementRate || 0
          }
        });
      }
      
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      logger.error('Error generating video recommendations:', error);
      return [];
    }
  }

  /**
   * Pobiera podobne wideo na podstawie kategorii i biznesu
   */
  static async getSimilarVideos(
    videoId: string,
    limit: number = 5
  ): Promise<VideoRecommendation[]> {
    try {
      const currentVideo = this.videoDatabase.get(videoId);
      if (!currentVideo) return [];

      const similarVideos = Array.from(this.videoDatabase.values())
        .filter(video => video.id !== videoId)
        .map(video => {
          let score = 0;
          
          // Same business = high score
          if (video.businessName === currentVideo.businessName) {
            score += 50;
          }
          
          // Same category = medium score
          if (video.category === currentVideo.category) {
            score += 30;
          }
          
          // Similar duration = small bonus
          const durationDiff = Math.abs(video.duration - currentVideo.duration);
          if (durationDiff < 60) score += 10; // Less than 1 minute difference
          
          return { ...video, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const recommendations: VideoRecommendation[] = [];
      
      for (const video of similarVideos) {
        const metrics = await VideoAnalyticsService.getVideoMetrics(video.id);
        
        recommendations.push({
          videoId: video.id,
          title: video.title,
          businessName: video.businessName,
          category: video.category,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          score: video.score,
          reason: video.businessName === currentVideo.businessName 
            ? `Więcej od ${video.businessName}`
            : `Podobne: ${video.category}`,
          metrics: {
            views: metrics?.totalViews || 0,
            rating: video.rating || 0,
            engagementRate: metrics?.engagementRate || 0
          }
        });
      }
      
      return recommendations;
      
    } catch (error) {
      logger.error('Error getting similar videos:', error);
      return [];
    }
  }

  /**
   * Oblicza score rekomendacji na podstawie ML algorithms
   */
  private static async calculateRecommendationScore(
    video: any, 
    userProfile: UserVideoProfile
  ): Promise<number> {
    let score = 0;
    
    // 1. Category preference (40% weight)
    const categoryScore = userProfile.preferences.categories[video.category] || 0;
    score += categoryScore * 0.4;
    
    // 2. Duration preference (20% weight)
    const durationDiff = Math.abs(video.duration - userProfile.preferences.preferredDuration);
    const durationScore = Math.max(0, 100 - (durationDiff / 60) * 10); // Penalty for duration difference
    score += durationScore * 0.2;
    
    // 3. Video popularity & quality (25% weight)
    const metrics = await VideoAnalyticsService.getVideoMetrics(video.id);
    if (metrics) {
      const popularityScore = Math.min(100, (metrics.totalViews / 100) * 10); // Normalize views
      const qualityScore = metrics.completionRate; // High completion rate = good quality
      score += (popularityScore + qualityScore) / 2 * 0.25;
    }
    
    // 4. Collaborative filtering (15% weight)
    const collaborativeScore = await this.getCollaborativeFilteringScore(video.id, userProfile);
    score += collaborativeScore * 0.15;
    
    return Math.min(100, score);
  }

  /**
   * Collaborative filtering - users with similar preferences
   */
  private static async getCollaborativeFilteringScore(
    videoId: string, 
    userProfile: UserVideoProfile
  ): Promise<number> {
    // Find similar users based on watch history
    const similarUsers = Array.from(this.userProfiles.values())
      .filter(profile => profile.userId !== userProfile.userId)
      .map(profile => ({
        profile,
        similarity: this.calculateUserSimilarity(userProfile, profile)
      }))
      .filter(({ similarity }) => similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
    
    if (similarUsers.length === 0) return 50; // Default score
    
    // Check if similar users liked this video
    const likesFromSimilarUsers = similarUsers.filter(({ profile }) => 
      profile.history.likedVideos.includes(videoId)
    ).length;
    
    return (likesFromSimilarUsers / similarUsers.length) * 100;
  }

  /**
   * Oblicza podobieństwo między użytkownikami
   */
  private static calculateUserSimilarity(user1: UserVideoProfile, user2: UserVideoProfile): number {
    const categories1 = Object.keys(user1.preferences.categories);
    const categories2 = Object.keys(user2.preferences.categories);
    
    const commonCategories = categories1.filter(cat => categories2.includes(cat));
    if (commonCategories.length === 0) return 0;
    
    // Cosine similarity for category preferences
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const category of commonCategories) {
      const pref1 = user1.preferences.categories[category] || 0;
      const pref2 = user2.preferences.categories[category] || 0;
      
      dotProduct += pref1 * pref2;
      norm1 += pref1 * pref1;
      norm2 += pref2 * pref2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Generuje przyczynę rekomendacji
   */
  private static getRecommendationReason(
    video: any, 
    userProfile: UserVideoProfile, 
    score: number
  ): string {
    if (score > 80) {
      return `Podobne do Twoich ulubionych ${video.category}`;
    } else if (score > 60) {
      return `Popularne w kategorii ${video.category}`;
    } else if (userProfile.preferences.categories[video.category] > 50) {
      return `Bo lubisz ${video.category}`;
    } else {
      return 'Nowe dla Ciebie';
    }
  }

  /**
   * Pobiera lub tworzy profil użytkownika
   */
  private static getUserProfile(userId: string): UserVideoProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        preferences: {
          categories: {},
          avgWatchTime: 0,
          preferredDuration: 300, // 5 minutes default
          engagementPatterns: []
        },
        history: {
          watchedVideos: [],
          likedVideos: [],
          sharedVideos: [],
          completedVideos: []
        }
      });
    }
    
    return this.userProfiles.get(userId)!;
  }

  /**
   * Aktualizuje profil użytkownika na podstawie aktywności
   */
  static async updateUserProfile(userId: string, activity: {
    videoId: string;
    category: string;
    watchTime: number;
    duration: number;
    action: 'watch' | 'like' | 'share' | 'complete';
  }): Promise<void> {
    const profile = this.getUserProfile(userId);
    
    // Update category preferences
    profile.preferences.categories[activity.category] = 
      (profile.preferences.categories[activity.category] || 0) + 
      (activity.watchTime / activity.duration * 100);
    
    // Update history based on action
    switch (activity.action) {
      case 'watch':
        if (!profile.history.watchedVideos.includes(activity.videoId)) {
          profile.history.watchedVideos.push(activity.videoId);
        }
        break;
      case 'like':
        if (!profile.history.likedVideos.includes(activity.videoId)) {
          profile.history.likedVideos.push(activity.videoId);
        }
        break;
      case 'share':
        if (!profile.history.sharedVideos.includes(activity.videoId)) {
          profile.history.sharedVideos.push(activity.videoId);
        }
        break;
      case 'complete':
        if (!profile.history.completedVideos.includes(activity.videoId)) {
          profile.history.completedVideos.push(activity.videoId);
        }
        break;
    }
    
    // Update preferred duration (moving average)
    profile.preferences.preferredDuration = 
      (profile.preferences.preferredDuration * 0.9) + (activity.duration * 0.1);
  }

  /**
   * Pobiera trending videos na podstawie analytics
   */
  static async getTrendingVideos(limit: number = 10): Promise<VideoRecommendation[]> {
    try {
      const allVideos = Array.from(this.videoDatabase.values());
      const trendingVideos: VideoRecommendation[] = [];
      
      for (const video of allVideos) {
        const metrics = await VideoAnalyticsService.getVideoMetrics(video.id);
        
        if (metrics) {
          // Trending score based on recent views and engagement
          const trendingScore = (metrics.totalViews * 0.6) + (metrics.engagementRate * 0.4);
          
          trendingVideos.push({
            videoId: video.id,
            title: video.title,
            businessName: video.businessName,
            category: video.category,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            score: trendingScore,
            reason: 'Trending teraz',
            metrics: {
              views: metrics.totalViews,
              rating: video.rating || 0,
              engagementRate: metrics.engagementRate
            }
          });
        }
      }
      
      return trendingVideos
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      logger.error('Error getting trending videos:', error);
      return [];
    }
  }
}

export { VideoRecommendationService };