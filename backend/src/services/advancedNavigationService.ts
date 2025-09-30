import { logger } from '../utils/logger';

interface NavigationWaypoint {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  type?: 'start' | 'end' | 'waypoint' | 'poi';
  estimatedArrival?: Date;
  visitDuration?: number; // in minutes
}

interface RouteOptions {
  mode: 'driving' | 'walking' | 'cycling' | 'transit';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  optimizeRoute?: boolean; // for multiple waypoints
  departureTime?: Date;
  arrivalTime?: Date;
  language?: string;
  units?: 'metric' | 'imperial';
}

interface RouteSegment {
  startPoint: NavigationWaypoint;
  endPoint: NavigationWaypoint;
  distance: number; // in meters
  duration: number; // in seconds
  instructions: NavigationInstruction[];
  polyline: string; // encoded polyline
  trafficCondition?: 'unknown' | 'clear' | 'light' | 'moderate' | 'heavy' | 'severe';
}

interface NavigationInstruction {
  id: string;
  maneuver: string;
  instruction: string;
  distance: number; // distance to next instruction
  duration: number; // time to next instruction
  location: {
    latitude: number;
    longitude: number;
  };
  streetName?: string;
  direction?: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  turnAngle?: number;
}

interface NavigationRoute {
  id: string;
  userId: string;
  name?: string;
  waypoints: NavigationWaypoint[];
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  options: RouteOptions;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  metadata?: {
    businessId?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  };
}

interface NavigationSession {
  sessionId: string;
  userId: string;
  routeId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  };
  currentSegmentIndex: number;
  currentInstructionIndex: number;
  startTime: Date;
  estimatedArrival: Date;
  isActive: boolean;
  deviations: NavigationDeviation[];
  reroutes: number;
  lastUpdate: Date;
}

interface NavigationDeviation {
  id: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  deviationDistance: number; // meters from planned route
  reason?: 'traffic' | 'user_choice' | 'road_closure' | 'unknown';
  wasRerouted: boolean;
}

interface TrafficUpdate {
  id: string;
  roadSegmentId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number; // affected area in meters
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'accident' | 'construction' | 'heavy_traffic' | 'road_closure' | 'weather';
  description: string;
  startTime: Date;
  estimatedEndTime?: Date;
  affectedRoutes: string[];
}

interface PointOfInterest {
  id: string;
  name: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  rating?: number;
  reviewCount?: number;
  businessHours?: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  amenities?: string[];
  photos?: string[];
  businessId?: string;
}

class AdvancedNavigationService {
  private routes: Map<string, NavigationRoute> = new Map();
  private activeSessions: Map<string, NavigationSession> = new Map();
  private trafficUpdates: Map<string, TrafficUpdate> = new Map();
  private poisCache: Map<string, PointOfInterest[]> = new Map();

  /**
   * Create a new navigation route
   */
  async createRoute(
    userId: string,
    waypoints: NavigationWaypoint[],
    options: RouteOptions,
    name?: string,
    metadata?: NavigationRoute['metadata']
  ): Promise<{ success: boolean; routeId?: string; route?: NavigationRoute; error?: string }> {
    try {
      if (waypoints.length < 2) {
        return { success: false, error: 'Route must have at least 2 waypoints' };
      }

      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate route segments
      const segments = await this.calculateRouteSegments(waypoints, options);
      if (segments.length === 0) {
        return { success: false, error: 'Could not calculate route' };
      }

      // Calculate total distance and duration
      const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
      const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);

      const route: NavigationRoute = {
        id: routeId,
        userId,
        name,
        waypoints,
        segments,
        totalDistance,
        totalDuration,
        options,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        metadata
      };

      this.routes.set(routeId, route);

      logger.info(`Created navigation route: ${routeId} for user: ${userId}`);
      return { success: true, routeId, route };
    } catch (error) {
      logger.error('Error creating navigation route:', error);
      return { success: false, error: 'Failed to create route' };
    }
  }

  /**
   * Start a navigation session
   */
  async startNavigation(
    userId: string,
    routeId: string,
    currentLocation: NavigationSession['currentLocation']
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const route = this.routes.get(routeId);
      if (!route) {
        return { success: false, error: 'Route not found' };
      }

      if (route.userId !== userId) {
        return { success: false, error: 'Unauthorized access to route' };
      }

      const sessionId = `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate estimated arrival time
      const estimatedArrival = new Date(Date.now() + route.totalDuration * 1000);

      const session: NavigationSession = {
        sessionId,
        userId,
        routeId,
        currentLocation,
        currentSegmentIndex: 0,
        currentInstructionIndex: 0,
        startTime: new Date(),
        estimatedArrival,
        isActive: true,
        deviations: [],
        reroutes: 0,
        lastUpdate: new Date()
      };

      this.activeSessions.set(sessionId, session);

      logger.info(`Started navigation session: ${sessionId} for route: ${routeId}`);
      return { success: true, sessionId };
    } catch (error) {
      logger.error('Error starting navigation:', error);
      return { success: false, error: 'Failed to start navigation' };
    }
  }

  /**
   * Update navigation session with current location
   */
  async updateNavigation(
    sessionId: string,
    currentLocation: NavigationSession['currentLocation']
  ): Promise<{ 
    success: boolean; 
    instruction?: NavigationInstruction; 
    needsReroute?: boolean;
    nextInstructions?: NavigationInstruction[];
    error?: string;
  }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || !session.isActive) {
        return { success: false, error: 'Navigation session not found or inactive' };
      }

      const route = this.routes.get(session.routeId);
      if (!route) {
        return { success: false, error: 'Route not found' };
      }

      // Update session location
      session.currentLocation = currentLocation;
      session.lastUpdate = new Date();

      // Check if user deviated from route
      const currentSegment = route.segments[session.currentSegmentIndex];
      if (currentSegment) {
        const deviationDistance = this.calculateDeviationFromRoute(currentLocation, currentSegment);
        
        if (deviationDistance > 100) { // 100 meters deviation threshold
          const deviation: NavigationDeviation = {
            id: `dev_${Date.now()}`,
            timestamp: new Date(),
            location: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            deviationDistance,
            wasRerouted: false
          };
          
          session.deviations.push(deviation);
          
          // Check if reroute is needed
          if (deviationDistance > 500 || session.deviations.length > 3) {
            return { 
              success: true, 
              needsReroute: true,
              instruction: this.getCurrentInstruction(route, session)
            };
          }
        }

        // Get current and next instructions
        const currentInstruction = this.getCurrentInstruction(route, session);
        const nextInstructions = this.getNextInstructions(route, session, 3);

        // Check if user has reached next instruction
        if (currentInstruction) {
          const distanceToInstruction = this.calculateDistance(
            currentLocation,
            currentInstruction.location
          );

          // If within 50 meters of instruction, advance to next
          if (distanceToInstruction <= 50) {
            this.advanceToNextInstruction(session, route);
          }
        }

        this.activeSessions.set(sessionId, session);

        return {
          success: true,
          instruction: currentInstruction,
          nextInstructions,
          needsReroute: false
        };
      }

      return { success: false, error: 'No current segment found' };
    } catch (error) {
      logger.error('Error updating navigation:', error);
      return { success: false, error: 'Failed to update navigation' };
    }
  }

  /**
   * Request route rerouting
   */
  async rerouteNavigation(
    sessionId: string,
    currentLocation: NavigationSession['currentLocation'],
    avoidAreas?: Array<{ latitude: number; longitude: number; radius: number }>
  ): Promise<{ success: boolean; newRoute?: NavigationRoute; error?: string }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || !session.isActive) {
        return { success: false, error: 'Navigation session not found or inactive' };
      }

      const originalRoute = this.routes.get(session.routeId);
      if (!originalRoute) {
        return { success: false, error: 'Original route not found' };
      }

      // Create new waypoints starting from current location
      const remainingWaypoints = originalRoute.waypoints.slice(session.currentSegmentIndex + 1);
      const newWaypoints: NavigationWaypoint[] = [
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          type: 'start',
          name: 'Current Location'
        },
        ...remainingWaypoints
      ];

      // Create modified route options to avoid problematic areas
      const newOptions: RouteOptions = {
        ...originalRoute.options,
        // Add logic to avoid specified areas
      };

      // Create new route
      const rerouteResult = await this.createRoute(
        session.userId,
        newWaypoints,
        newOptions,
        `${originalRoute.name} (Rerouted)`,
        originalRoute.metadata
      );

      if (!rerouteResult.success || !rerouteResult.route) {
        return { success: false, error: 'Failed to calculate new route' };
      }

      // Update session with new route
      session.routeId = rerouteResult.route.id;
      session.currentSegmentIndex = 0;
      session.currentInstructionIndex = 0;
      session.reroutes++;
      
      // Mark last deviation as rerouted
      if (session.deviations.length > 0) {
        session.deviations[session.deviations.length - 1].wasRerouted = true;
      }

      this.activeSessions.set(sessionId, session);

      logger.info(`Rerouted navigation session: ${sessionId}, reroute count: ${session.reroutes}`);
      return { success: true, newRoute: rerouteResult.route };
    } catch (error) {
      logger.error('Error rerouting navigation:', error);
      return { success: false, error: 'Failed to reroute' };
    }
  }

  /**
   * Stop navigation session
   */
  async stopNavigation(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Navigation session not found' };
      }

      session.isActive = false;
      session.lastUpdate = new Date();
      
      this.activeSessions.set(sessionId, session);

      logger.info(`Stopped navigation session: ${sessionId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error stopping navigation:', error);
      return { success: false, error: 'Failed to stop navigation' };
    }
  }

  /**
   * Get points of interest near a location
   */
  async getPointsOfInterest(
    location: { latitude: number; longitude: number },
    radius: number = 1000, // meters
    category?: string,
    limit: number = 20
  ): Promise<PointOfInterest[]> {
    try {
      const cacheKey = `${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}_${radius}_${category}`;
      
      // Check cache first
      const cached = this.poisCache.get(cacheKey);
      if (cached) {
        return cached.slice(0, limit);
      }

      // Simulate POI search (in real implementation, this would query external APIs or database)
      const pois: PointOfInterest[] = await this.searchPOIs(location, radius, category);
      
      // Cache results
      this.poisCache.set(cacheKey, pois);
      
      return pois.slice(0, limit);
    } catch (error) {
      logger.error('Error getting points of interest:', error);
      return [];
    }
  }

  /**
   * Add traffic update
   */
  async addTrafficUpdate(
    location: { latitude: number; longitude: number },
    radius: number,
    severity: TrafficUpdate['severity'],
    type: TrafficUpdate['type'],
    description: string,
    estimatedEndTime?: Date
  ): Promise<{ success: boolean; updateId?: string; error?: string }> {
    try {
      const updateId = `traffic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const trafficUpdate: TrafficUpdate = {
        id: updateId,
        roadSegmentId: `segment_${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}`,
        location,
        radius,
        severity,
        type,
        description,
        startTime: new Date(),
        estimatedEndTime,
        affectedRoutes: [] // Would be populated based on route analysis
      };

      this.trafficUpdates.set(updateId, trafficUpdate);

      logger.info(`Added traffic update: ${updateId} (${type}, ${severity})`);
      return { success: true, updateId };
    } catch (error) {
      logger.error('Error adding traffic update:', error);
      return { success: false, error: 'Failed to add traffic update' };
    }
  }

  /**
   * Get active navigation sessions for a user
   */
  async getActiveNavigationSessions(userId: string): Promise<NavigationSession[]> {
    try {
      return Array.from(this.activeSessions.values())
        .filter(session => session.userId === userId && session.isActive);
    } catch (error) {
      logger.error('Error getting active navigation sessions:', error);
      return [];
    }
  }

  /**
   * Get user's saved routes
   */
  async getUserRoutes(userId: string): Promise<NavigationRoute[]> {
    try {
      return Array.from(this.routes.values())
        .filter(route => route.userId === userId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      logger.error('Error getting user routes:', error);
      return [];
    }
  }

  /**
   * Calculate route segments (simplified implementation)
   */
  private async calculateRouteSegments(
    waypoints: NavigationWaypoint[],
    options: RouteOptions
  ): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      
      // Simplified segment calculation (in real implementation, use routing API)
      const distance = this.calculateDistance(start, end);
      const duration = this.estimateTravelTime(distance, options.mode);
      
      const segment: RouteSegment = {
        startPoint: start,
        endPoint: end,
        distance,
        duration,
        instructions: await this.generateInstructions(start, end, options),
        polyline: this.encodePolyline([start, end]), // Simplified
        trafficCondition: 'unknown'
      };
      
      segments.push(segment);
    }
    
    return segments;
  }

  /**
   * Generate navigation instructions for a segment
   */
  private async generateInstructions(
    start: NavigationWaypoint,
    end: NavigationWaypoint,
    options: RouteOptions
  ): Promise<NavigationInstruction[]> {
    // Simplified instruction generation
    const distance = this.calculateDistance(start, end);
    const duration = this.estimateTravelTime(distance, options.mode);
    
    return [
      {
        id: `instr_${Date.now()}`,
        maneuver: 'straight',
        instruction: `Head ${this.calculateBearing(start, end)} towards ${end.name || 'destination'}`,
        distance,
        duration,
        location: { latitude: start.latitude, longitude: start.longitude },
        streetName: 'Unknown Street'
      }
    ];
  }

  /**
   * Calculate distance between two points
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
   * Estimate travel time based on distance and mode
   */
  private estimateTravelTime(distance: number, mode: RouteOptions['mode']): number {
    const speedKmh = {
      driving: 50,
      walking: 5,
      cycling: 15,
      transit: 30
    };
    
    const speedMs = speedKmh[mode] * 1000 / 3600; // Convert to m/s
    return Math.round(distance / speedMs);
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ): string {
    const dLon = this.toRadians(end.longitude - start.longitude);
    const lat1 = this.toRadians(start.latitude);
    const lat2 = this.toRadians(end.latitude);
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x);
    const bearingDegrees = (bearing * 180 / Math.PI + 360) % 360;
    
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
    const index = Math.round(bearingDegrees / 45) % 8;
    return directions[index];
  }

  /**
   * Encode polyline (simplified)
   */
  private encodePolyline(points: Array<{ latitude: number; longitude: number }>): string {
    // Simplified polyline encoding (in real implementation, use proper algorithm)
    return points.map(p => `${p.latitude},${p.longitude}`).join('|');
  }

  /**
   * Calculate deviation from route
   */
  private calculateDeviationFromRoute(
    location: { latitude: number; longitude: number },
    segment: RouteSegment
  ): number {
    // Simplified deviation calculation (distance to segment line)
    const distanceToStart = this.calculateDistance(location, segment.startPoint);
    const distanceToEnd = this.calculateDistance(location, segment.endPoint);
    
    // Return minimum distance to segment endpoints (simplified)
    return Math.min(distanceToStart, distanceToEnd);
  }

  /**
   * Get current navigation instruction
   */
  private getCurrentInstruction(route: NavigationRoute, session: NavigationSession): NavigationInstruction | undefined {
    const segment = route.segments[session.currentSegmentIndex];
    if (!segment) return undefined;
    
    return segment.instructions[session.currentInstructionIndex];
  }

  /**
   * Get next navigation instructions
   */
  private getNextInstructions(route: NavigationRoute, session: NavigationSession, count: number): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];
    let segmentIndex = session.currentSegmentIndex;
    let instructionIndex = session.currentInstructionIndex + 1;
    
    while (instructions.length < count && segmentIndex < route.segments.length) {
      const segment = route.segments[segmentIndex];
      
      if (instructionIndex < segment.instructions.length) {
        instructions.push(segment.instructions[instructionIndex]);
        instructionIndex++;
      } else {
        segmentIndex++;
        instructionIndex = 0;
      }
    }
    
    return instructions;
  }

  /**
   * Advance to next instruction
   */
  private advanceToNextInstruction(session: NavigationSession, route: NavigationRoute): void {
    const segment = route.segments[session.currentSegmentIndex];
    if (!segment) return;
    
    if (session.currentInstructionIndex < segment.instructions.length - 1) {
      session.currentInstructionIndex++;
    } else if (session.currentSegmentIndex < route.segments.length - 1) {
      session.currentSegmentIndex++;
      session.currentInstructionIndex = 0;
    }
  }

  /**
   * Search POIs (mock implementation)
   */
  private async searchPOIs(
    location: { latitude: number; longitude: number },
    radius: number,
    category?: string
  ): Promise<PointOfInterest[]> {
    // Mock POI data (in real implementation, query external APIs or database)
    return [];
  }

  /**
   * Clean up old routes and sessions
   */
  async cleanup(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Remove old inactive sessions
      const expiredSessions = Array.from(this.activeSessions.entries())
        .filter(([_, session]) => !session.isActive && session.lastUpdate < oneDayAgo);
      
      for (const [sessionId] of expiredSessions) {
        this.activeSessions.delete(sessionId);
      }
      
      // Remove old routes
      const oldRoutes = Array.from(this.routes.entries())
        .filter(([_, route]) => !route.isActive && route.updatedAt < thirtyDaysAgo);
      
      for (const [routeId] of oldRoutes) {
        this.routes.delete(routeId);
      }
      
      // Remove expired traffic updates
      const expiredTraffic = Array.from(this.trafficUpdates.entries())
        .filter(([_, update]) => {
          if (update.estimatedEndTime && update.estimatedEndTime < new Date()) {
            return true;
          }
          return update.startTime < oneDayAgo;
        });
      
      for (const [updateId] of expiredTraffic) {
        this.trafficUpdates.delete(updateId);
      }
      
      // Clear POI cache
      this.poisCache.clear();

      logger.info('Completed navigation service cleanup');
    } catch (error) {
      logger.error('Error during navigation cleanup:', error);
    }
  }
}

export default AdvancedNavigationService;
export { 
  NavigationWaypoint, 
  RouteOptions, 
  RouteSegment, 
  NavigationInstruction,
  NavigationRoute,
  NavigationSession,
  NavigationDeviation,
  TrafficUpdate,
  PointOfInterest
};