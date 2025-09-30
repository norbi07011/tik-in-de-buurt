import { logger } from '../utils/logger';

export interface VideoAnalyticsData {
  videoId: string;
  userId: string;
  businessId?: string;
  watchTime: number;
  totalDuration: number;
  completionRate: number;
  dropOffPoints: number[];
  interactions: {
    likes: number;
    shares: number;
    comments: number;
    saves: number;
  };
  deviceInfo: {
    type: 'mobile' | 'desktop' | 'tablet';
    browser: string;
    os: string;
  };
  quality: string;
  playbackSpeed: number;
  timestamp: Date;
}

export interface VideoMetrics {
  videoId: string;
  totalViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  engagementRate: number;
  retentionCurve: { time: number; viewers: number }[];
  topDropOffPoints: number[];
  demographics: {
    devices: Record<string, number>;
    browsers: Record<string, number>;
    avgSessionDuration: number;
  };
}

class VideoAnalyticsService {
  private static analyticsData: Map<string, VideoAnalyticsData[]> = new Map();
  
  /**
   * Rejestruje wydarzenie oglądania wideo
   */
  static async recordVideoEvent(data: Partial<VideoAnalyticsData>): Promise<void> {
    try {
      const analytics: VideoAnalyticsData = {
        videoId: data.videoId || '',
        userId: data.userId || 'anonymous',
        businessId: data.businessId,
        watchTime: data.watchTime || 0,
        totalDuration: data.totalDuration || 0,
        completionRate: data.totalDuration ? (data.watchTime || 0) / data.totalDuration * 100 : 0,
        dropOffPoints: data.dropOffPoints || [],
        interactions: data.interactions || { likes: 0, shares: 0, comments: 0, saves: 0 },
        deviceInfo: data.deviceInfo || { type: 'desktop', browser: 'unknown', os: 'unknown' },
        quality: data.quality || 'auto',
        playbackSpeed: data.playbackSpeed || 1,
        timestamp: new Date()
      };

      if (!this.analyticsData.has(analytics.videoId)) {
        this.analyticsData.set(analytics.videoId, []);
      }
      
      this.analyticsData.get(analytics.videoId)?.push(analytics);
      
      logger.info(`Video analytics recorded for ${analytics.videoId}: ${analytics.watchTime}s watched`);
    } catch (error) {
      logger.error('Error recording video analytics:', error);
    }
  }

  /**
   * Pobiera metryki dla konkretnego wideo
   */
  static async getVideoMetrics(videoId: string): Promise<VideoMetrics | null> {
    try {
      const analytics = this.analyticsData.get(videoId) || [];
      
      if (analytics.length === 0) {
        return null;
      }

      const totalViews = analytics.length;
      const totalWatchTime = analytics.reduce((sum, a) => sum + a.watchTime, 0);
      const averageWatchTime = totalWatchTime / totalViews;
      const completionRate = analytics.reduce((sum, a) => sum + a.completionRate, 0) / totalViews;
      
      // Engagement rate based on interactions
      const totalInteractions = analytics.reduce((sum, a) => 
        sum + a.interactions.likes + a.interactions.shares + a.interactions.comments + a.interactions.saves, 0
      );
      const engagementRate = (totalInteractions / totalViews) * 100;

      // Device demographics
      const devices: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      
      analytics.forEach(a => {
        devices[a.deviceInfo.type] = (devices[a.deviceInfo.type] || 0) + 1;
        browsers[a.deviceInfo.browser] = (browsers[a.deviceInfo.browser] || 0) + 1;
      });

      return {
        videoId,
        totalViews,
        totalWatchTime,
        averageWatchTime,
        completionRate,
        engagementRate,
        retentionCurve: this.calculateRetentionCurve(analytics),
        topDropOffPoints: this.getTopDropOffPoints(analytics),
        demographics: {
          devices,
          browsers,
          avgSessionDuration: averageWatchTime
        }
      };
    } catch (error) {
      logger.error('Error getting video metrics:', error);
      return null;
    }
  }

  /**
   * Pobiera metryki dla wszystkich wideo biznesu
   */
  static async getBusinessVideoMetrics(businessId: string): Promise<VideoMetrics[]> {
    const businessVideos: VideoMetrics[] = [];
    
    for (const [videoId, analytics] of this.analyticsData.entries()) {
      const hasBusinessVideos = analytics.some(a => a.businessId === businessId);
      if (hasBusinessVideos) {
        const metrics = await this.getVideoMetrics(videoId);
        if (metrics) {
          businessVideos.push(metrics);
        }
      }
    }
    
    return businessVideos;
  }

  /**
   * Oblicza krzywą retencji widzów
   */
  private static calculateRetentionCurve(analytics: VideoAnalyticsData[]): { time: number; viewers: number }[] {
    const maxDuration = Math.max(...analytics.map(a => a.totalDuration));
    const curve: { time: number; viewers: number }[] = [];
    
    for (let time = 0; time <= maxDuration; time += 10) {
      const viewersAtTime = analytics.filter(a => a.watchTime >= time).length;
      curve.push({ time, viewers: viewersAtTime });
    }
    
    return curve;
  }

  /**
   * Znajduje najczęstsze punkty porzucenia oglądania
   */
  private static getTopDropOffPoints(analytics: VideoAnalyticsData[]): number[] {
    const allDropOffs = analytics.flatMap(a => a.dropOffPoints);
    const grouped = allDropOffs.reduce((acc, point) => {
      acc[point] = (acc[point] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([point]) => parseInt(point));
  }

  /**
   * Czyści stare dane analityczne (starsze niż 90 dni)
   */
  static async cleanupOldAnalytics(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    let cleanedCount = 0;
    
    for (const [videoId, analytics] of this.analyticsData.entries()) {
      const filteredAnalytics = analytics.filter(a => a.timestamp > cutoffDate);
      
      if (filteredAnalytics.length !== analytics.length) {
        cleanedCount += analytics.length - filteredAnalytics.length;
        
        if (filteredAnalytics.length === 0) {
          this.analyticsData.delete(videoId);
        } else {
          this.analyticsData.set(videoId, filteredAnalytics);
        }
      }
    }
    
    logger.info(`Cleaned up ${cleanedCount} old video analytics records`);
    return cleanedCount;
  }
}

export { VideoAnalyticsService };