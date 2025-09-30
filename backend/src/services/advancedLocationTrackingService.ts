import { logger } from '../utils/logger';

interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

interface UserLocationHistory {
  userId: string;
  locations: LocationPoint[];
  lastUpdate: Date;
  isTracking: boolean;
  trackingMode: 'precise' | 'balanced' | 'battery_saving';
}

interface LocationShareSession {
  sessionId: string;
  userId: string;
  sharedWith: string[];
  location: LocationPoint;
  expiresAt: Date;
  isActive: boolean;
  permissions: {
    canSeeExactLocation: boolean;
    canSeeMovement: boolean;
    canReceiveNotifications: boolean;
  };
}

interface ProximityAlert {
  id: string;
  userId: string;
  targetUserId: string;
  radius: number; // in meters
  isActive: boolean;
  triggeredAt?: Date;
  message?: string;
}

interface LocationAnalytics {
  userId: string;
  totalDistance: number; // in meters
  averageSpeed: number; // in m/s
  timeSpentMoving: number; // in minutes
  mostVisitedAreas: Array<{
    center: LocationPoint;
    visitCount: number;
    averageTimeSpent: number;
  }>;
  travelPatterns: Array<{
    route: LocationPoint[];
    frequency: number;
    averageDuration: number;
  }>;
}

class AdvancedLocationTrackingService {
  private userLocations: Map<string, UserLocationHistory> = new Map();
  private locationSessions: Map<string, LocationShareSession> = new Map();
  private proximityAlerts: Map<string, ProximityAlert> = new Map();

  /**
   * Start real-time location tracking for a user
   */
  async startLocationTracking(
    userId: string, 
    trackingMode: 'precise' | 'balanced' | 'battery_saving' = 'balanced'
  ): Promise<{ success: boolean; trackingId: string }> {
    try {
      const existingHistory = this.userLocations.get(userId);
      
      const locationHistory: UserLocationHistory = {
        userId,
        locations: existingHistory?.locations || [],
        lastUpdate: new Date(),
        isTracking: true,
        trackingMode
      };

      this.userLocations.set(userId, locationHistory);

      logger.info(`Started location tracking for user ${userId} in ${trackingMode} mode`);
      
      return {
        success: true,
        trackingId: `track_${userId}_${Date.now()}`
      };
    } catch (error) {
      logger.error('Error starting location tracking:', error);
      return { success: false, trackingId: '' };
    }
  }

  /**
   * Stop location tracking for a user
   */
  async stopLocationTracking(userId: string): Promise<boolean> {
    try {
      const locationHistory = this.userLocations.get(userId);
      if (locationHistory) {
        locationHistory.isTracking = false;
        locationHistory.lastUpdate = new Date();
        this.userLocations.set(userId, locationHistory);
      }

      logger.info(`Stopped location tracking for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error stopping location tracking:', error);
      return false;
    }
  }

  /**
   * Update user's current location
   */
  async updateLocation(userId: string, location: Omit<LocationPoint, 'timestamp'>): Promise<boolean> {
    try {
      const locationHistory = this.userLocations.get(userId);
      if (!locationHistory || !locationHistory.isTracking) {
        return false;
      }

      const locationPoint: LocationPoint = {
        ...location,
        timestamp: new Date()
      };

      // Add to location history (keep last 1000 points)
      locationHistory.locations.push(locationPoint);
      if (locationHistory.locations.length > 1000) {
        locationHistory.locations = locationHistory.locations.slice(-1000);
      }

      locationHistory.lastUpdate = new Date();
      this.userLocations.set(userId, locationHistory);

      // Check proximity alerts
      this.checkProximityAlerts(userId, locationPoint);

      // Update active sharing sessions
      this.updateLocationSharingSessions(userId, locationPoint);

      logger.debug(`Updated location for user ${userId}:`, locationPoint);
      return true;
    } catch (error) {
      logger.error('Error updating location:', error);
      return false;
    }
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation(userId: string): Promise<LocationPoint | null> {
    try {
      const locationHistory = this.userLocations.get(userId);
      if (!locationHistory || locationHistory.locations.length === 0) {
        return null;
      }

      return locationHistory.locations[locationHistory.locations.length - 1];
    } catch (error) {
      logger.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get user's location history
   */
  async getLocationHistory(
    userId: string, 
    startDate?: Date, 
    endDate?: Date,
    limit: number = 100
  ): Promise<LocationPoint[]> {
    try {
      const locationHistory = this.userLocations.get(userId);
      if (!locationHistory) {
        return [];
      }

      let locations = locationHistory.locations;

      // Filter by date range if provided
      if (startDate || endDate) {
        locations = locations.filter(location => {
          const timestamp = location.timestamp;
          if (startDate && timestamp < startDate) return false;
          if (endDate && timestamp > endDate) return false;
          return true;
        });
      }

      // Apply limit
      return locations.slice(-limit);
    } catch (error) {
      logger.error('Error getting location history:', error);
      return [];
    }
  }

  /**
   * Start location sharing session
   */
  async startLocationSharing(
    userId: string,
    sharedWith: string[],
    durationMinutes: number = 60,
    permissions: LocationShareSession['permissions'] = {
      canSeeExactLocation: true,
      canSeeMovement: true,
      canReceiveNotifications: false
    }
  ): Promise<{ success: boolean; sessionId?: string }> {
    try {
      const currentLocation = await this.getCurrentLocation(userId);
      if (!currentLocation) {
        return { success: false };
      }

      const sessionId = `share_${userId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      const shareSession: LocationShareSession = {
        sessionId,
        userId,
        sharedWith,
        location: currentLocation,
        expiresAt,
        isActive: true,
        permissions
      };

      this.locationSessions.set(sessionId, shareSession);

      logger.info(`Started location sharing session ${sessionId} for user ${userId}`);
      return { success: true, sessionId };
    } catch (error) {
      logger.error('Error starting location sharing:', error);
      return { success: false };
    }
  }

  /**
   * Stop location sharing session
   */
  async stopLocationSharing(sessionId: string): Promise<boolean> {
    try {
      const session = this.locationSessions.get(sessionId);
      if (session) {
        session.isActive = false;
        this.locationSessions.set(sessionId, session);
        logger.info(`Stopped location sharing session ${sessionId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error stopping location sharing:', error);
      return false;
    }
  }

  /**
   * Get shared locations for a user
   */
  async getSharedLocations(userId: string): Promise<LocationShareSession[]> {
    try {
      const sessions = Array.from(this.locationSessions.values())
        .filter(session => 
          session.sharedWith.includes(userId) && 
          session.isActive && 
          session.expiresAt > new Date()
        );

      return sessions;
    } catch (error) {
      logger.error('Error getting shared locations:', error);
      return [];
    }
  }

  /**
   * Create proximity alert
   */
  async createProximityAlert(
    userId: string,
    targetUserId: string,
    radius: number,
    message?: string
  ): Promise<{ success: boolean; alertId?: string }> {
    try {
      const alertId = `prox_${userId}_${targetUserId}_${Date.now()}`;
      
      const alert: ProximityAlert = {
        id: alertId,
        userId,
        targetUserId,
        radius,
        isActive: true,
        message
      };

      this.proximityAlerts.set(alertId, alert);

      logger.info(`Created proximity alert ${alertId} between users ${userId} and ${targetUserId}`);
      return { success: true, alertId };
    } catch (error) {
      logger.error('Error creating proximity alert:', error);
      return { success: false };
    }
  }

  /**
   * Check proximity alerts for a user
   */
  private async checkProximityAlerts(userId: string, location: LocationPoint): Promise<void> {
    try {
      const userAlerts = Array.from(this.proximityAlerts.values())
        .filter(alert => alert.userId === userId && alert.isActive);

      for (const alert of userAlerts) {
        const targetLocation = await this.getCurrentLocation(alert.targetUserId);
        if (!targetLocation) continue;

        const distance = this.calculateDistance(location, targetLocation);
        
        if (distance <= alert.radius && !alert.triggeredAt) {
          alert.triggeredAt = new Date();
          this.proximityAlerts.set(alert.id, alert);

          // Here you would typically send a notification
          logger.info(`Proximity alert triggered: ${alert.id}, distance: ${distance}m`);
        }
      }
    } catch (error) {
      logger.error('Error checking proximity alerts:', error);
    }
  }

  /**
   * Update location sharing sessions with new location
   */
  private async updateLocationSharingSessions(userId: string, location: LocationPoint): Promise<void> {
    try {
      const userSessions = Array.from(this.locationSessions.values())
        .filter(session => session.userId === userId && session.isActive);

      for (const session of userSessions) {
        session.location = location;
        this.locationSessions.set(session.sessionId, session);
      }
    } catch (error) {
      logger.error('Error updating location sharing sessions:', error);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate location analytics for a user
   */
  async generateLocationAnalytics(userId: string, days: number = 30): Promise<LocationAnalytics | null> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      const locations = await this.getLocationHistory(userId, startDate, endDate, 10000);
      if (locations.length < 2) {
        return null;
      }

      let totalDistance = 0;
      let totalMovingTime = 0;
      const speeds: number[] = [];

      // Calculate distance and speed
      for (let i = 1; i < locations.length; i++) {
        const distance = this.calculateDistance(locations[i - 1], locations[i]);
        const timeDiff = (locations[i].timestamp.getTime() - locations[i - 1].timestamp.getTime()) / 1000; // seconds
        
        totalDistance += distance;
        totalMovingTime += timeDiff / 60; // convert to minutes
        
        if (timeDiff > 0) {
          speeds.push(distance / timeDiff); // m/s
        }
      }

      const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

      // Find most visited areas (simplified clustering)
      const mostVisitedAreas = this.findMostVisitedAreas(locations);

      const analytics: LocationAnalytics = {
        userId,
        totalDistance,
        averageSpeed,
        timeSpentMoving: totalMovingTime,
        mostVisitedAreas,
        travelPatterns: [] // Would implement more complex pattern analysis
      };

      return analytics;
    } catch (error) {
      logger.error('Error generating location analytics:', error);
      return null;
    }
  }

  /**
   * Find most visited areas using simple clustering
   */
  private findMostVisitedAreas(locations: LocationPoint[]): LocationAnalytics['mostVisitedAreas'] {
    const clusters: Map<string, { points: LocationPoint[], visitCount: number }> = new Map();
    const clusterRadius = 100; // 100 meters

    for (const location of locations) {
      let foundCluster = false;
      
      for (const [key, cluster] of clusters) {
        const clusterCenter = this.calculateCentroid(cluster.points);
        const distance = this.calculateDistance(location, clusterCenter);
        
        if (distance <= clusterRadius) {
          cluster.points.push(location);
          cluster.visitCount++;
          foundCluster = true;
          break;
        }
      }
      
      if (!foundCluster) {
        const clusterKey = `${Math.round(location.latitude * 1000)}_${Math.round(location.longitude * 1000)}`;
        clusters.set(clusterKey, {
          points: [location],
          visitCount: 1
        });
      }
    }

    return Array.from(clusters.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 10)
      .map(cluster => ({
        center: this.calculateCentroid(cluster.points),
        visitCount: cluster.visitCount,
        averageTimeSpent: 0 // Would calculate based on time spent in area
      }));
  }

  /**
   * Calculate centroid of a group of points
   */
  private calculateCentroid(points: LocationPoint[]): LocationPoint {
    const sum = points.reduce(
      (acc, point) => ({
        latitude: acc.latitude + point.latitude,
        longitude: acc.longitude + point.longitude
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / points.length,
      longitude: sum.longitude / points.length,
      accuracy: 0,
      timestamp: new Date()
    };
  }

  /**
   * Clean up expired sessions and old data
   */
  async cleanup(): Promise<void> {
    try {
      const now = new Date();
      
      // Remove expired sharing sessions
      for (const [sessionId, session] of this.locationSessions) {
        if (!session.isActive || session.expiresAt < now) {
          this.locationSessions.delete(sessionId);
        }
      }

      // Clean old location data (keep only last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      for (const [userId, history] of this.userLocations) {
        history.locations = history.locations.filter(
          location => location.timestamp > thirtyDaysAgo
        );
        this.userLocations.set(userId, history);
      }

      logger.info('Completed location tracking cleanup');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

export default AdvancedLocationTrackingService;
export { LocationPoint, UserLocationHistory, LocationShareSession, ProximityAlert, LocationAnalytics };