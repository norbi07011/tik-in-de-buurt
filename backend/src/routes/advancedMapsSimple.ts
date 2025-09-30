import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authSimple';
import AdvancedLocationTrackingService from '../services/advancedLocationTrackingService';
import GeofencingService from '../services/geofencingService';
import AdvancedNavigationService from '../services/advancedNavigationService';
import { logger } from '../utils/logger';

const router = Router();

// Initialize services
const locationTrackingService = new AdvancedLocationTrackingService();
const geofencingService = new GeofencingService();
const navigationService = new AdvancedNavigationService();

// =============================================================================
// ADVANCED LOCATION TRACKING ROUTES
// =============================================================================

/**
 * Start location tracking
 */
router.post('/location/tracking/start', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { trackingMode = 'balanced' } = req.body;

    const result = await locationTrackingService.startLocationTracking(userId, trackingMode);
    
    if (result.success) {
      res.json({
        success: true,
        trackingId: result.trackingId,
        message: 'Location tracking started successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to start location tracking'
      });
    }
  } catch (error) {
    logger.error('Error starting location tracking:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Update current location
 */
router.post('/location/update', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { latitude, longitude, accuracy, altitude, heading, speed } = req.body;

    if (!latitude || !longitude || !accuracy) {
      res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and accuracy are required'
      });
      return;
    }

    const location = { latitude, longitude, accuracy, altitude, heading, speed };
    const success = await locationTrackingService.updateLocation(userId, location);
    
    if (success) {
      res.json({
        success: true,
        message: 'Location updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to update location'
      });
    }
  } catch (error) {
    logger.error('Error updating location:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get current location
 */
router.get('/location/current', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const location = await locationTrackingService.getCurrentLocation(userId);
    
    if (location) {
      res.json({
        success: true,
        location
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Current location not found'
      });
    }
  } catch (error) {
    logger.error('Error getting current location:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Start location sharing
 */
router.post('/location/sharing/start', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { sharedWith, durationMinutes = 60, permissions } = req.body;

    if (!sharedWith || !Array.isArray(sharedWith)) {
      res.status(400).json({
        success: false,
        error: 'sharedWith must be an array of user IDs'
      });
      return;
    }

    const result = await locationTrackingService.startLocationSharing(
      userId, 
      sharedWith, 
      durationMinutes, 
      permissions
    );
    
    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        message: 'Location sharing started successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to start location sharing'
      });
    }
  } catch (error) {
    logger.error('Error starting location sharing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================================================
// GEOFENCING ROUTES
// =============================================================================

/**
 * Create geofence
 */
router.post('/geofence', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).user.userId;
    const { name, geometry, type, triggers, metadata, description } = req.body;

    if (!name || !geometry || !type || !triggers) {
      res.status(400).json({
        success: false,
        error: 'name, geometry, type, and triggers are required'
      });
      return;
    }

    const result = await geofencingService.createGeofence(
      ownerId, 
      name, 
      geometry, 
      type, 
      triggers, 
      metadata, 
      description
    );
    
    if (result.success) {
      res.json({
        success: true,
        geofenceId: result.geofenceId,
        message: 'Geofence created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to create geofence'
      });
    }
  } catch (error) {
    logger.error('Error creating geofence:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get user's geofences
 */
router.get('/geofence/my', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).user.userId;

    const geofences = await geofencingService.getGeofencesByOwner(ownerId);
    
    res.json({
      success: true,
      geofences,
      count: geofences.length
    });
  } catch (error) {
    logger.error('Error getting user geofences:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================================================
// ADVANCED NAVIGATION ROUTES  
// =============================================================================

/**
 * Create navigation route
 */
router.post('/navigation/route', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { waypoints, options, name, metadata } = req.body;

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      res.status(400).json({
        success: false,
        error: 'waypoints must be an array with at least 2 waypoints'
      });
      return;
    }

    if (!options || !options.mode) {
      res.status(400).json({
        success: false,
        error: 'options with mode are required'
      });
      return;
    }

    const result = await navigationService.createRoute(
      userId, 
      waypoints, 
      options, 
      name, 
      metadata
    );
    
    if (result.success) {
      res.json({
        success: true,
        routeId: result.routeId,
        message: 'Navigation route created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to create route'
      });
    }
  } catch (error) {
    logger.error('Error creating navigation route:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Start navigation
 */
router.post('/navigation/start/:routeId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { routeId } = req.params;
    const { currentLocation } = req.body;

    if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
      res.status(400).json({
        success: false,
        error: 'currentLocation with latitude and longitude are required'
      });
      return;
    }

    const result = await navigationService.startNavigation(userId, routeId, currentLocation);
    
    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        message: 'Navigation started successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to start navigation'
      });
    }
  } catch (error) {
    logger.error('Error starting navigation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get points of interest
 */
router.get('/navigation/points-of-interest', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, radius = 1000, category, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'latitude and longitude are required'
      });
      return;
    }

    const location = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string)
    };

    const pois = await navigationService.getPointsOfInterest(
      location,
      parseInt(radius as string),
      category as string,
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      pointsOfInterest: pois,
      count: pois.length
    });
  } catch (error) {
    logger.error('Error getting points of interest:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;