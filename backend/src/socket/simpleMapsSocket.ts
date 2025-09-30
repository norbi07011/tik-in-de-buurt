import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import AdvancedLocationTrackingService from '../services/advancedLocationTrackingService';
import GeofencingService from '../services/geofencingService';
import AdvancedNavigationService from '../services/advancedNavigationService';
import AuthService from '../services/authService';

export interface SimpleAuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

export class SimpleMapsSocketHandler {
  private io: SocketIOServer;
  private locationTrackingService: AdvancedLocationTrackingService;
  private geofencingService: GeofencingService;
  private navigationService: AdvancedNavigationService;
  private connectedUsers: Map<string, Socket>;
  private navigationSessions: Map<string, { socket: Socket, sessionId: string }>;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://tik-in-de-buurt.netlify.app',
          'https://www.tik-in-de-buurt.com'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.locationTrackingService = new AdvancedLocationTrackingService();
    this.geofencingService = new GeofencingService();
    this.navigationService = new AdvancedNavigationService();
    this.connectedUsers = new Map();
    this.navigationSessions = new Map();

    this.setupEventHandlers();
    
    logger.info('📍 Simple Maps Socket.IO handler initialized');
  }

  private setupEventHandlers(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          logger.warn('Socket connection rejected: No authentication token');
          return next(new Error('Authentication required'));
        }

        const decoded = AuthService.verifyToken(token);
        (socket as SimpleAuthenticatedSocket).userId = decoded.id;
        (socket as SimpleAuthenticatedSocket).username = decoded.name || 'Unknown';
        
        logger.info(`Socket authenticated: ${decoded.id} (${decoded.name || 'Unknown'})`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket) => {
      const authSocket = socket as SimpleAuthenticatedSocket;
      logger.info(`🔗 User connected: ${authSocket.userId} (${authSocket.username})`);
      
      // Store connected user
      if (authSocket.userId) {
        this.connectedUsers.set(authSocket.userId, socket);
        
        // Join user to their personal room
        socket.join(`user:${authSocket.userId}`);
      }

      // Setup location tracking events
      this.setupLocationEvents(authSocket);
      
      // Setup geofencing events
      this.setupGeofenceEvents(authSocket);
      
      // Setup navigation events
      this.setupNavigationEvents(authSocket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(authSocket);
      });
    });
  }

  private setupLocationEvents(socket: SimpleAuthenticatedSocket): void {
    // Start real-time location tracking
    socket.on('location:start-tracking', async (data) => {
      try {
        if (!socket.userId) return;
        
        const { trackingMode = 'balanced' } = data;
        
        const result = await this.locationTrackingService.startLocationTracking(
          socket.userId,
          trackingMode
        );

        if (result.success) {
          socket.emit('location:tracking-started', {
            success: true,
            trackingId: result.trackingId,
            mode: trackingMode
          });
          logger.info(`Location tracking started for user ${socket.userId}`);
        } else {
          socket.emit('location:tracking-error', {
            success: false,
            error: 'Failed to start location tracking'
          });
        }
      } catch (error) {
        logger.error('Error starting location tracking:', error);
        socket.emit('location:tracking-error', {
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Receive location updates
    socket.on('location:update', async (locationData) => {
      try {
        if (!socket.userId) return;
        
        const { latitude, longitude, accuracy, altitude, heading, speed } = locationData;
        
        const success = await this.locationTrackingService.updateLocation(
          socket.userId,
          { latitude, longitude, accuracy, altitude, heading, speed }
        );

        if (success) {
          // Broadcast to location sharing rooms
          socket.broadcast.to(`location-share:${socket.userId}`).emit('location:user-moved', {
            userId: socket.userId,
            username: socket.username,
            location: { latitude, longitude, accuracy, altitude, heading, speed },
            timestamp: new Date()
          });

          // Process geofencing
          const geofenceEvents = await this.geofencingService.processLocationUpdate(
            socket.userId,
            { latitude, longitude, accuracy }
          );

          // Emit geofence events
          geofenceEvents.forEach(event => {
            socket.emit('geofence:event', event);
          });
        }
      } catch (error) {
        logger.error('Error processing location update:', error);
        socket.emit('location:update-error', {
          success: false,
          error: 'Failed to process location update'
        });
      }
    });

    // Stop location tracking
    socket.on('location:stop-tracking', async () => {
      try {
        if (!socket.userId) return;
        
        const success = await this.locationTrackingService.stopLocationTracking(socket.userId);
        
        socket.emit('location:tracking-stopped', { success });
        logger.info(`Location tracking stopped for user ${socket.userId}`);
      } catch (error) {
        logger.error('Error stopping location tracking:', error);
        socket.emit('location:tracking-error', {
          success: false,
          error: 'Failed to stop location tracking'
        });
      }
    });
  }

  private setupGeofenceEvents(socket: SimpleAuthenticatedSocket): void {
    // Create geofence
    socket.on('geofence:create', async (geofenceData) => {
      try {
        if (!socket.userId) return;
        
        const { name, geometry, type, triggers, metadata, description } = geofenceData;
        
        const result = await this.geofencingService.createGeofence(
          socket.userId,
          name,
          geometry,
          type,
          triggers,
          metadata,
          description
        );

        if (result.success) {
          socket.emit('geofence:created', {
            success: true,
            geofenceId: result.geofenceId
          });

          // Join geofence room for updates
          socket.join(`geofence:${result.geofenceId}`);
          logger.info(`Geofence created by user ${socket.userId}: ${result.geofenceId}`);
        } else {
          socket.emit('geofence:create-error', {
            success: false,
            error: result.error || 'Failed to create geofence'
          });
        }
      } catch (error) {
        logger.error('Error creating geofence:', error);
        socket.emit('geofence:create-error', {
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Subscribe to geofence events
    socket.on('geofence:subscribe', async (data) => {
      try {
        const { geofenceIds } = data;
        
        if (Array.isArray(geofenceIds)) {
          geofenceIds.forEach(geofenceId => {
            socket.join(`geofence:${geofenceId}`);
          });

          socket.emit('geofence:subscribed', {
            success: true,
            geofenceIds
          });

          logger.info(`User ${socket.userId} subscribed to geofences: ${geofenceIds.join(', ')}`);
        }
      } catch (error) {
        logger.error('Error subscribing to geofences:', error);
        socket.emit('geofence:subscribe-error', {
          success: false,
          error: 'Failed to subscribe to geofences'
        });
      }
    });
  }

  private setupNavigationEvents(socket: SimpleAuthenticatedSocket): void {
    // Start navigation
    socket.on('navigation:start', async (data) => {
      try {
        if (!socket.userId) return;
        
        const { routeId, currentLocation } = data;
        
        const result = await this.navigationService.startNavigation(
          socket.userId,
          routeId,
          currentLocation
        );

        if (result.success) {
          // Store navigation session
          if (result.sessionId) {
            this.navigationSessions.set(result.sessionId, {
              socket,
              sessionId: result.sessionId
            });
          }

          socket.emit('navigation:started', {
            success: true,
            sessionId: result.sessionId
          });

          logger.info(`Navigation started for user ${socket.userId}: ${result.sessionId}`);
        } else {
          socket.emit('navigation:start-error', {
            success: false,
            error: result.error || 'Failed to start navigation'
          });
        }
      } catch (error) {
        logger.error('Error starting navigation:', error);
        socket.emit('navigation:start-error', {
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Stop navigation
    socket.on('navigation:stop', async (data) => {
      try {
        const { sessionId } = data;
        
        const result = await this.navigationService.stopNavigation(sessionId);

        if (result.success) {
          // Remove from active sessions
          this.navigationSessions.delete(sessionId);

          socket.emit('navigation:stopped', {
            success: true,
            sessionId
          });

          logger.info(`Navigation stopped for session ${sessionId}`);
        } else {
          socket.emit('navigation:stop-error', {
            success: false,
            error: result.error || 'Navigation session not found'
          });
        }
      } catch (error) {
        logger.error('Error stopping navigation:', error);
        socket.emit('navigation:stop-error', {
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Emergency broadcast
    socket.on('maps:emergency', async (data) => {
      try {
        const { location, message, type = 'general' } = data;
        
        const emergencyAlert = {
          userId: socket.userId,
          username: socket.username,
          location,
          message,
          type,
          timestamp: new Date()
        };

        // Broadcast to all connected users
        this.io.emit('maps:emergency-alert', emergencyAlert);

        logger.warn(`Emergency alert from user ${socket.userId}: ${type} - ${message}`);
        
        socket.emit('maps:emergency-sent', {
          success: true,
          message: 'Emergency alert sent to all users'
        });
      } catch (error) {
        logger.error('Error broadcasting emergency:', error);
        socket.emit('maps:emergency-error', {
          success: false,
          error: 'Failed to send emergency alert'
        });
      }
    });
  }

  private handleDisconnection(socket: SimpleAuthenticatedSocket): void {
    logger.info(`🔌 User disconnected: ${socket.userId} (${socket.username})`);
    
    if (socket.userId) {
      // Remove from connected users
      this.connectedUsers.delete(socket.userId);
      
      // Clean up navigation sessions
      for (const [sessionId, session] of this.navigationSessions.entries()) {
        if (session.socket.id === socket.id) {
          this.navigationSessions.delete(sessionId);
          // Stop navigation session
          this.navigationService.stopNavigation(sessionId).catch(error => {
            logger.error(`Error stopping navigation session ${sessionId}:`, error);
          });
        }
      }
      
      // Stop location tracking
      this.locationTrackingService.stopLocationTracking(socket.userId).catch(error => {
        logger.error(`Error stopping location tracking for ${socket.userId}:`, error);
      });
    }
  }

  public getConnectedUsers(): Map<string, Socket> {
    return this.connectedUsers;
  }

  public getActiveNavigationSessions(): Map<string, { socket: Socket, sessionId: string }> {
    return this.navigationSessions;
  }

  public broadcastToAllUsers(event: string, data: any): void {
    this.io.emit(event, data);
  }
}

export default SimpleMapsSocketHandler;