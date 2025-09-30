import { logger } from '../utils/logger';

interface GeofenceZone {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // User or business that created the zone
  type: 'circular' | 'polygon';
  geometry: CircularGeofence | PolygonGeofence;
  triggers: {
    onEnter: boolean;
    onExit: boolean;
    onDwell: boolean;
    dwellTimeMinutes?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    category: string;
    businessId?: string;
    priority: 'low' | 'medium' | 'high';
    color?: string;
    icon?: string;
  };
}

interface CircularGeofence {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
}

interface PolygonGeofence {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
}

interface GeofenceEvent {
  id: string;
  userId: string;
  geofenceId: string;
  eventType: 'enter' | 'exit' | 'dwell';
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  duration?: number; // for dwell events, in minutes
  metadata?: {
    deviceId?: string;
    appVersion?: string;
    [key: string]: any;
  };
}

interface UserGeofenceState {
  userId: string;
  currentZones: Set<string>; // geofence IDs user is currently inside
  lastUpdate: Date;
  dwellStartTimes: Map<string, Date>; // geofence ID -> entry time
}

interface GeofenceNotification {
  id: string;
  userId: string;
  geofenceId: string;
  event: GeofenceEvent;
  message: string;
  notificationType: 'push' | 'email' | 'sms' | 'webhook';
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

class GeofencingService {
  private geofences: Map<string, GeofenceZone> = new Map();
  private userStates: Map<string, UserGeofenceState> = new Map();
  private events: GeofenceEvent[] = [];
  private notifications: Map<string, GeofenceNotification> = new Map();

  /**
   * Create a new geofence zone
   */
  async createGeofence(
    ownerId: string,
    name: string,
    geometry: CircularGeofence | PolygonGeofence,
    type: 'circular' | 'polygon',
    triggers: GeofenceZone['triggers'],
    metadata?: GeofenceZone['metadata'],
    description?: string
  ): Promise<{ success: boolean; geofenceId?: string; error?: string }> {
    try {
      const geofenceId = `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Validate geometry
      const validationResult = this.validateGeometry(geometry, type);
      if (!validationResult.isValid) {
        return { success: false, error: validationResult.error };
      }

      const geofence: GeofenceZone = {
        id: geofenceId,
        name,
        description,
        ownerId,
        type,
        geometry,
        triggers,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata
      };

      this.geofences.set(geofenceId, geofence);
      
      logger.info(`Created geofence: ${geofenceId} (${name}) for owner: ${ownerId}`);
      return { success: true, geofenceId };
    } catch (error) {
      logger.error('Error creating geofence:', error);
      return { success: false, error: 'Failed to create geofence' };
    }
  }

  /**
   * Update an existing geofence
   */
  async updateGeofence(
    geofenceId: string,
    updates: Partial<Omit<GeofenceZone, 'id' | 'ownerId' | 'createdAt'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const geofence = this.geofences.get(geofenceId);
      if (!geofence) {
        return { success: false, error: 'Geofence not found' };
      }

      // Validate geometry if it's being updated
      if (updates.geometry && updates.type) {
        const validationResult = this.validateGeometry(updates.geometry, updates.type);
        if (!validationResult.isValid) {
          return { success: false, error: validationResult.error };
        }
      }

      const updatedGeofence: GeofenceZone = {
        ...geofence,
        ...updates,
        updatedAt: new Date()
      };

      this.geofences.set(geofenceId, updatedGeofence);
      
      logger.info(`Updated geofence: ${geofenceId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error updating geofence:', error);
      return { success: false, error: 'Failed to update geofence' };
    }
  }

  /**
   * Delete a geofence
   */
  async deleteGeofence(geofenceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const geofence = this.geofences.get(geofenceId);
      if (!geofence) {
        return { success: false, error: 'Geofence not found' };
      }

      this.geofences.delete(geofenceId);
      
      // Clean up user states
      for (const [userId, state] of this.userStates) {
        state.currentZones.delete(geofenceId);
        state.dwellStartTimes.delete(geofenceId);
      }

      logger.info(`Deleted geofence: ${geofenceId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting geofence:', error);
      return { success: false, error: 'Failed to delete geofence' };
    }
  }

  /**
   * Get geofences for a specific owner
   */
  async getGeofencesByOwner(ownerId: string): Promise<GeofenceZone[]> {
    try {
      return Array.from(this.geofences.values())
        .filter(geofence => geofence.ownerId === ownerId);
    } catch (error) {
      logger.error('Error getting geofences by owner:', error);
      return [];
    }
  }

  /**
   * Get all active geofences in a specific area
   */
  async getGeofencesInArea(
    center: { latitude: number; longitude: number },
    radiusKm: number
  ): Promise<GeofenceZone[]> {
    try {
      const geofencesInArea: GeofenceZone[] = [];
      
      for (const geofence of this.geofences.values()) {
        if (!geofence.isActive) continue;
        
        if (this.isGeofenceInArea(geofence, center, radiusKm)) {
          geofencesInArea.push(geofence);
        }
      }
      
      return geofencesInArea;
    } catch (error) {
      logger.error('Error getting geofences in area:', error);
      return [];
    }
  }

  /**
   * Process location update for a user
   */
  async processLocationUpdate(
    userId: string,
    location: { latitude: number; longitude: number; accuracy: number }
  ): Promise<GeofenceEvent[]> {
    try {
      const events: GeofenceEvent[] = [];
      
      // Get or create user state
      let userState = this.userStates.get(userId);
      if (!userState) {
        userState = {
          userId,
          currentZones: new Set(),
          lastUpdate: new Date(),
          dwellStartTimes: new Map()
        };
        this.userStates.set(userId, userState);
      }

      const previousZones = new Set(userState.currentZones);
      const currentZones = new Set<string>();

      // Check all active geofences
      for (const geofence of this.geofences.values()) {
        if (!geofence.isActive) continue;
        
        const isInside = this.isPointInGeofence(location, geofence);
        
        if (isInside) {
          currentZones.add(geofence.id);
          
          // Check for ENTER event
          if (!previousZones.has(geofence.id) && geofence.triggers.onEnter) {
            const event = this.createGeofenceEvent(userId, geofence.id, 'enter', location);
            events.push(event);
            this.events.push(event);
            
            // Start dwell tracking if enabled
            if (geofence.triggers.onDwell) {
              userState.dwellStartTimes.set(geofence.id, new Date());
            }
          }
          
          // Check for DWELL event
          if (geofence.triggers.onDwell && geofence.triggers.dwellTimeMinutes) {
            const dwellStart = userState.dwellStartTimes.get(geofence.id);
            if (dwellStart) {
              const dwellMinutes = (Date.now() - dwellStart.getTime()) / (1000 * 60);
              if (dwellMinutes >= geofence.triggers.dwellTimeMinutes) {
                const event = this.createGeofenceEvent(userId, geofence.id, 'dwell', location, dwellMinutes);
                events.push(event);
                this.events.push(event);
                
                // Reset dwell start time to prevent duplicate events
                userState.dwellStartTimes.set(geofence.id, new Date());
              }
            }
          }
        } else {
          // Check for EXIT event
          if (previousZones.has(geofence.id) && geofence.triggers.onExit) {
            const event = this.createGeofenceEvent(userId, geofence.id, 'exit', location);
            events.push(event);
            this.events.push(event);
            
            // Clear dwell tracking
            userState.dwellStartTimes.delete(geofence.id);
          }
        }
      }

      // Update user state
      userState.currentZones = currentZones;
      userState.lastUpdate = new Date();
      this.userStates.set(userId, userState);

      // Process notifications for events
      for (const event of events) {
        await this.processGeofenceNotification(event);
      }

      return events;
    } catch (error) {
      logger.error('Error processing location update:', error);
      return [];
    }
  }

  /**
   * Get geofence events for a user
   */
  async getGeofenceEvents(
    userId?: string,
    geofenceId?: string,
    eventType?: 'enter' | 'exit' | 'dwell',
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<GeofenceEvent[]> {
    try {
      let filteredEvents = this.events;

      if (userId) {
        filteredEvents = filteredEvents.filter(event => event.userId === userId);
      }

      if (geofenceId) {
        filteredEvents = filteredEvents.filter(event => event.geofenceId === geofenceId);
      }

      if (eventType) {
        filteredEvents = filteredEvents.filter(event => event.eventType === eventType);
      }

      if (startDate || endDate) {
        filteredEvents = filteredEvents.filter(event => {
          if (startDate && event.timestamp < startDate) return false;
          if (endDate && event.timestamp > endDate) return false;
          return true;
        });
      }

      return filteredEvents
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting geofence events:', error);
      return [];
    }
  }

  /**
   * Get current zones for a user
   */
  async getCurrentZones(userId: string): Promise<GeofenceZone[]> {
    try {
      const userState = this.userStates.get(userId);
      if (!userState) {
        return [];
      }

      const zones: GeofenceZone[] = [];
      for (const zoneId of userState.currentZones) {
        const zone = this.geofences.get(zoneId);
        if (zone) {
          zones.push(zone);
        }
      }

      return zones;
    } catch (error) {
      logger.error('Error getting current zones:', error);
      return [];
    }
  }

  /**
   * Validate geometry based on type
   */
  private validateGeometry(
    geometry: CircularGeofence | PolygonGeofence,
    type: 'circular' | 'polygon'
  ): { isValid: boolean; error?: string } {
    try {
      if (type === 'circular') {
        const circular = geometry as CircularGeofence;
        if (!circular.center || !circular.radius) {
          return { isValid: false, error: 'Circular geofence must have center and radius' };
        }
        if (circular.radius <= 0 || circular.radius > 50000) {
          return { isValid: false, error: 'Radius must be between 1 and 50000 meters' };
        }
        if (Math.abs(circular.center.latitude) > 90 || Math.abs(circular.center.longitude) > 180) {
          return { isValid: false, error: 'Invalid coordinates for center' };
        }
      } else if (type === 'polygon') {
        const polygon = geometry as PolygonGeofence;
        if (!polygon.coordinates || polygon.coordinates.length < 3) {
          return { isValid: false, error: 'Polygon must have at least 3 coordinates' };
        }
        if (polygon.coordinates.length > 100) {
          return { isValid: false, error: 'Polygon cannot have more than 100 coordinates' };
        }
        for (const coord of polygon.coordinates) {
          if (Math.abs(coord.latitude) > 90 || Math.abs(coord.longitude) > 180) {
            return { isValid: false, error: 'Invalid coordinates in polygon' };
          }
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid geometry format' };
    }
  }

  /**
   * Check if a geofence is within a search area
   */
  private isGeofenceInArea(
    geofence: GeofenceZone,
    center: { latitude: number; longitude: number },
    radiusKm: number
  ): boolean {
    if (geofence.type === 'circular') {
      const circular = geofence.geometry as CircularGeofence;
      const distance = this.calculateDistance(center, circular.center);
      return distance <= (radiusKm * 1000 + circular.radius);
    } else {
      const polygon = geofence.geometry as PolygonGeofence;
      // Check if any polygon point is within the search area
      return polygon.coordinates.some(coord => {
        const distance = this.calculateDistance(center, coord);
        return distance <= radiusKm * 1000;
      });
    }
  }

  /**
   * Check if a point is inside a geofence
   */
  private isPointInGeofence(
    point: { latitude: number; longitude: number },
    geofence: GeofenceZone
  ): boolean {
    if (geofence.type === 'circular') {
      const circular = geofence.geometry as CircularGeofence;
      const distance = this.calculateDistance(point, circular.center);
      return distance <= circular.radius;
    } else {
      const polygon = geofence.geometry as PolygonGeofence;
      return this.isPointInPolygon(point, polygon.coordinates);
    }
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   */
  private isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: Array<{ latitude: number; longitude: number }>
  ): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const pi = polygon[i];
      const pj = polygon[j];
      
      if (((pi.latitude > point.latitude) !== (pj.latitude > point.latitude)) &&
          (point.longitude < (pj.longitude - pi.longitude) * (point.latitude - pi.latitude) / (pj.latitude - pi.latitude) + pi.longitude)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
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
   * Create a geofence event
   */
  private createGeofenceEvent(
    userId: string,
    geofenceId: string,
    eventType: 'enter' | 'exit' | 'dwell',
    location: { latitude: number; longitude: number; accuracy: number },
    duration?: number
  ): GeofenceEvent {
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      geofenceId,
      eventType,
      timestamp: new Date(),
      location,
      duration
    };
  }

  /**
   * Process geofence notification
   */
  private async processGeofenceNotification(event: GeofenceEvent): Promise<void> {
    try {
      const geofence = this.geofences.get(event.geofenceId);
      if (!geofence) return;

      // Create notification based on event type and geofence configuration
      let message = '';
      switch (event.eventType) {
        case 'enter':
          message = `You have entered ${geofence.name}`;
          break;
        case 'exit':
          message = `You have left ${geofence.name}`;
          break;
        case 'dwell':
          message = `You have been in ${geofence.name} for ${event.duration} minutes`;
          break;
      }

      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification: GeofenceNotification = {
        id: notificationId,
        userId: event.userId,
        geofenceId: event.geofenceId,
        event,
        message,
        notificationType: 'push', // Default to push notification
        status: 'pending'
      };

      this.notifications.set(notificationId, notification);

      // Here you would typically send the notification via your notification service
      logger.info(`Created geofence notification: ${notificationId} for event: ${event.id}`);
    } catch (error) {
      logger.error('Error processing geofence notification:', error);
    }
  }

  /**
   * Clean up old events and expired data
   */
  async cleanup(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Remove old events
      this.events = this.events.filter(event => event.timestamp > thirtyDaysAgo);
      
      // Remove old notifications
      const oldNotifications = Array.from(this.notifications.entries())
        .filter(([_, notification]) => notification.event.timestamp < thirtyDaysAgo);
      
      for (const [notificationId] of oldNotifications) {
        this.notifications.delete(notificationId);
      }

      logger.info('Completed geofencing cleanup');
    } catch (error) {
      logger.error('Error during geofencing cleanup:', error);
    }
  }
}

export default GeofencingService;
export { 
  GeofenceZone, 
  CircularGeofence, 
  PolygonGeofence, 
  GeofenceEvent, 
  UserGeofenceState,
  GeofenceNotification 
};