import express, { Request, Response } from 'express';
import Location, { ILocation } from '../models/Location';
import Business from '../models/Business';
import { geolocationService } from '../services/geolocationService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// 🔍 GET NEARBY BUSINESSES
router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius = 5000, category, limit = 50 } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ 
        message: 'Latitude and longitude are required',
        example: '/api/locations/nearby?lat=52.3676&lng=4.9041&radius=5000'
      });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const searchRadius = parseInt(radius as string);
    const resultLimit = parseInt(limit as string);

    // Validate coordinates
    if (!geolocationService.isValidCoordinates({ lat: latitude, lng: longitude })) {
      res.status(400).json({ message: 'Invalid coordinates provided' });
      return;
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: searchRadius,
          spherical: true,
          query: { verified: true }
        }
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessId',
          foreignField: '_id',
          as: 'business'
        }
      },
      {
        $unwind: '$business'
      }
    ];

    // Add category filter if provided
    if (category) {
      pipeline.push({
        $match: { 'business.category': category }
      });
    }

    // Add limit and projection
    pipeline.push(
      { $limit: resultLimit },
      {
        $project: {
          _id: 1,
          name: 1,
          coordinates: 1,
          address: 1,
          distance: { $round: ['$distance', 0] },
          business: {
            _id: 1,
            name: 1,
            category: 1,
            rating: 1,
            isVerified: 1,
            phone: 1,
            website: 1,
            openingHours: 1
          }
        }
      }
    );

    const nearbyLocations = await Location.aggregate(pipeline);

    res.json({
      success: true,
      count: nearbyLocations.length,
      center: { lat: latitude, lng: longitude },
      radius: searchRadius,
      results: nearbyLocations.map(location => ({
        id: location._id,
        name: location.name,
        position: {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng
        },
        address: location.address.formatted,
        distance: location.distance,
        business: {
          id: location.business._id,
          name: location.business.name,
          category: location.business.category,
          rating: location.business.rating,
          isVerified: location.business.isVerified,
          phone: location.business.phone,
          website: location.business.website,
          isOpen: isBusinessOpen(location.business.openingHours)
        }
      }))
    });

  } catch (error) {
    logger.error('🗺️ Error fetching nearby locations:', error);
    res.status(500).json({ message: 'Failed to fetch nearby locations' });
  }
});

// 🧭 GEOCODE ADDRESS
router.post('/geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.body;

    if (!address) {
      res.status(400).json({ message: 'Address is required' });
      return;
    }

    const result = await geolocationService.geocodeAddress(address);

    if (!result) {
      res.status(404).json({ 
        message: 'Address not found',
        suggestion: 'Try a more specific address or check spelling'
      });
      return;
    }

    res.json({
      success: true,
      result: {
        coordinates: result.coordinates,
        address: result.address,
        placeId: result.placeId,
        viewport: result.viewport
      }
    });

  } catch (error) {
    logger.error('🗺️ Geocoding error:', error);
    res.status(500).json({ message: 'Geocoding failed' });
  }
});

// 🔄 REVERSE GEOCODE COORDINATES
router.post('/reverse-geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      res.status(400).json({ message: 'Latitude and longitude are required' });
      return;
    }

    const coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };

    if (!geolocationService.isValidCoordinates(coordinates)) {
      res.status(400).json({ message: 'Invalid coordinates' });
      return;
    }

    const result = await geolocationService.reverseGeocode(coordinates);

    if (!result) {
      res.status(404).json({ message: 'No address found for these coordinates' });
      return;
    }

    res.json({
      success: true,
      result: {
        coordinates: result.coordinates,
        address: result.address,
        placeId: result.placeId
      }
    });

  } catch (error) {
    logger.error('🗺️ Reverse geocoding error:', error);
    res.status(500).json({ message: 'Reverse geocoding failed' });
  }
});

// 📏 CALCULATE DISTANCE
router.post('/distance', async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.body;

    if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
      res.status(400).json({ 
        message: 'Both from and to coordinates are required',
        format: 'Expected: { from: { lat: number, lng: number }, to: { lat: number, lng: number } }'
      });
      return;
    }

    const fromCoords = { lat: parseFloat(from.lat), lng: parseFloat(from.lng) };
    const toCoords = { lat: parseFloat(to.lat), lng: parseFloat(to.lng) };

    if (!geolocationService.isValidCoordinates(fromCoords) || 
        !geolocationService.isValidCoordinates(toCoords)) {
      res.status(400).json({ message: 'Invalid coordinates provided' });
      return;
    }

    const result = geolocationService.calculateDistance(fromCoords, toCoords);

    res.json({
      success: true,
      from: fromCoords,
      to: toCoords,
      distance: result.distance,
      unit: result.unit
    });

  } catch (error) {
    logger.error('🗺️ Distance calculation error:', error);
    res.status(500).json({ message: 'Distance calculation failed' });
  }
});

// 🏢 CREATE/UPDATE BUSINESS LOCATION
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId, address, coordinates, name, radius } = req.body;
    const userId = req.user?.id;

    if (!businessId || !address) {
      res.status(400).json({ message: 'Business ID and address are required' });
      return;
    }

    // Verify business ownership
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    if (business.ownerId.toString() !== userId) {
      res.status(403).json({ message: 'You can only manage locations for your own businesses' });
      return;
    }

    let locationCoordinates = coordinates;

    // Geocode address if coordinates not provided
    if (!locationCoordinates && address) {
      const geocodeResult = await geolocationService.geocodeAddress(
        typeof address === 'string' ? address : 
        `${address.street}, ${address.city} ${address.postalCode}, ${address.country}`
      );
      
      if (geocodeResult) {
        locationCoordinates = geocodeResult.coordinates;
      } else {
        res.status(400).json({ message: 'Unable to geocode the provided address' });
        return;
      }
    }

    // Check if location already exists for this business
    let location = await Location.findOne({ businessId });

    if (location) {
      // Update existing location
      location.name = name || business.name;
      location.address = typeof address === 'string' ? 
        { street: address, city: '', postalCode: '', country: 'Netherlands' } : 
        address;
      location.coordinates = locationCoordinates;
      location.radius = radius || location.radius;
      location.source = coordinates ? 'manual' : 'google_places';
      
      await location.save();
    } else {
      // Create new location
      location = new Location({
        businessId,
        name: name || business.name,
        address: typeof address === 'string' ? 
          { street: address, city: '', postalCode: '', country: 'Netherlands' } : 
          address,
        coordinates: locationCoordinates,
        radius: radius || 5,
        verified: false,
        source: coordinates ? 'manual' : 'google_places'
      });
      
      await location.save();
    }

    res.json({
      success: true,
      location: {
        id: location._id,
        businessId: location.businessId,
        name: location.name,
        coordinates: location.coordinates,
        address: location.address,
        radius: location.radius,
        verified: location.verified
      }
    });

  } catch (error) {
    logger.error('🗺️ Error creating/updating location:', error);
    res.status(500).json({ message: 'Failed to save location' });
  }
});

// 📍 GET BUSINESS LOCATIONS
router.get('/business/:businessId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;

    const locations = await Location.find({ businessId, verified: true })
      .populate('businessId', 'name category rating')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: locations.length,
      locations: locations.map(location => ({
        id: location._id,
        name: location.name,
        coordinates: location.coordinates,
        address: location.address,
        radius: location.radius,
        verified: location.verified,
        createdAt: location.createdAt
      }))
    });

  } catch (error) {
    logger.error('🗺️ Error fetching business locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// 🗺️ GET LOCATIONS WITHIN BOUNDS
router.get('/bounds', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sw_lat, sw_lng, ne_lat, ne_lng, category } = req.query;

    if (!sw_lat || !sw_lng || !ne_lat || !ne_lng) {
      res.status(400).json({ 
        message: 'Bounding box coordinates are required',
        format: 'sw_lat, sw_lng, ne_lat, ne_lng'
      });
      return;
    }

    const southwest = { 
      lat: parseFloat(sw_lat as string), 
      lng: parseFloat(sw_lng as string) 
    };
    const northeast = { 
      lat: parseFloat(ne_lat as string), 
      lng: parseFloat(ne_lng as string) 
    };

    const pipeline: any[] = [
      {
        $match: {
          coordinates: {
            $geoWithin: {
              $box: [
                [southwest.lng, southwest.lat],
                [northeast.lng, northeast.lat]
              ]
            }
          },
          verified: true
        }
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessId',
          foreignField: '_id',
          as: 'business'
        }
      },
      {
        $unwind: '$business'
      }
    ];

    if (category) {
      pipeline.push({
        $match: { 'business.category': category }
      });
    }

    const locations = await Location.aggregate(pipeline);

    res.json({
      success: true,
      bounds: { southwest, northeast },
      count: locations.length,
      locations: locations.map(location => ({
        id: location._id,
        name: location.name,
        position: {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng
        },
        business: {
          id: location.business._id,
          name: location.business.name,
          category: location.business.category,
          rating: location.business.rating
        }
      }))
    });

  } catch (error) {
    logger.error('🗺️ Error fetching locations within bounds:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// 🛠️ Helper function to check if business is open
function isBusinessOpen(openingHours: any): boolean {
  if (!openingHours || typeof openingHours !== 'object') {
    return false;
  }

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // mon, tue, etc.
  const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
  
  const todayHours = openingHours[currentDay];
  if (!todayHours) return false;

  const [openTime, closeTime] = todayHours.split('-').map((time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 100 + minutes;
  });

  return currentTime >= openTime && currentTime <= closeTime;
}

export default router;