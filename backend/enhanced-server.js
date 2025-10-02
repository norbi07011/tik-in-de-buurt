const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Mock database
let businesses = [];
let users = [];

// Payment System Mock Database
const paymentIntents = new Map();
const paymentAnalytics = [];

// Enhanced Geolocation System Mock Database
const geofenceZones = new Map();
const locationAnalytics = new Map();
const userTrajectories = new Map();
const routeCache = new Map();

// Payment configurations
const PAYMENT_CONFIGS = {
  stripe: {
    enabled: true,
    fees: { percentage: 1.4, fixed: 25 },
    currencies: ['PLN', 'EUR', 'USD']
  },
  blik: {
    enabled: true,
    fees: { percentage: 0.5, fixed: 0 },
    currencies: ['PLN']
  },
  przelewy24: {
    enabled: true,
    fees: { percentage: 1.2, fixed: 0 },
    currencies: ['PLN']
  },
  paypal: {
    enabled: true,
    fees: { percentage: 2.9, fixed: 35 },
    currencies: ['PLN', 'EUR', 'USD']
  },
  payu: {
    enabled: true,
    fees: { percentage: 1.5, fixed: 0 },
    currencies: ['PLN']
  }
};

// Geolocation configurations
const ROUTING_CONFIGS = {
  driving: { avgSpeed: 50, fuelConsumption: 7.5 },
  walking: { avgSpeed: 5, fuelConsumption: 0 },
  cycling: { avgSpeed: 15, fuelConsumption: 0 },
  transit: { avgSpeed: 30, fuelConsumption: 0 }
};

// Payment helper functions
const calculateFees = (method, amount) => {
  const config = PAYMENT_CONFIGS[method];
  if (!config) return 0;
  return Math.round((amount * config.fees.percentage / 100) + config.fees.fixed);
};

// Geolocation helper functions
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const generateRouteSteps = (start, end, mode) => {
  const steps = [];
  const distance = calculateDistance(start[0], start[1], end[0], end[1]);
  const config = ROUTING_CONFIGS[mode];
  const duration = Math.round((distance / 1000) / config.avgSpeed * 3600);
  
  // Generate sample route steps
  steps.push({
    id: 'step_start',
    instruction: getLocalizedInstruction('start', 'pl'),
    distance: 0,
    duration: 0,
    maneuver: 'depart',
    coordinates: start,
    streetName: 'Punkt startowy'
  });
  
  const midPoint = [
    (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 0.01,
    (start[1] + end[1]) / 2 + (Math.random() - 0.5) * 0.01
  ];
  
  steps.push({
    id: 'step_mid',
    instruction: getLocalizedInstruction('continue', 'pl'),
    distance: Math.round(distance * 0.6),
    duration: Math.round(duration * 0.6),
    maneuver: 'straight',
    coordinates: midPoint,
    streetName: 'ul. Przykładowa',
    landmarks: [
      {
        name: 'Kawiarnia "Pod Aniołami"',
        type: 'restaurant',
        distance: 50,
        side: 'right'
      }
    ]
  });
  
  steps.push({
    id: 'step_end',
    instruction: getLocalizedInstruction('arrive', 'pl'),
    distance: 0,
    duration: 0,
    maneuver: 'arrive',
    coordinates: end,
    streetName: 'Cel podróży'
  });
  
  return { steps, totalDistance: distance, totalDuration: duration };
};

const getLocalizedInstruction = (type, language) => {
  const instructions = {
    start: { pl: 'Rozpocznij podróż', en: 'Start your journey' },
    continue: { pl: 'Jedź prosto', en: 'Continue straight' },
    turn_left: { pl: 'Skręć w lewo', en: 'Turn left' },
    turn_right: { pl: 'Skręć w prawo', en: 'Turn right' },
    arrive: { pl: 'Dotarłeś do celu', en: 'You have arrived' }
  };
  return instructions[type]?.[language] || instructions[type]?.['en'] || 'Continue';
};

const generateTransactionId = () => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getMethodName = (methodId) => {
  const names = {
    stripe: 'Karta płatnicza',
    blik: 'BLIK',
    przelewy24: 'Przelewy24',
    paypal: 'PayPal',
    payu: 'PayU'
  };
  return names[methodId] || methodId;
};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5177', 'http://127.0.0.1:5177'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    ok: true,
    db: 'mock',
    status: 'OK', 
    server: 'enhanced-backend',
    port: PORT,
    timestamp: new Date().toISOString(),
    environment: 'development',
    businesses: businesses.length,
    users: users.length,
    paymentSystem: 'active',
    geolocationSystem: 'active',
    geofenceZones: geofenceZones.size,
    routeCache: routeCache.size,
    userTrajectories: userTrajectories.size
  });
});

// Payment API endpoints

// GET /api/payments/methods - Get available payment methods
app.get('/api/payments/methods', (req, res) => {
  try {
    const currency = req.query.currency || 'PLN';
    
    const methods = Object.entries(PAYMENT_CONFIGS)
      .filter(([_, config]) => config.enabled && config.currencies.includes(currency))
      .map(([id, config]) => ({
        id,
        name: getMethodName(id),
        fees: config.fees,
        currencies: config.currencies,
        enabled: config.enabled
      }));

    console.log('💳 Payment methods requested for currency:', currency);
    res.json({
      success: true,
      methods,
      currency
    });
  } catch (error) {
    console.error('❌ Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/payments/process - Process payment
app.post('/api/payments/process', async (req, res) => {
  const startTime = Date.now();
  let transactionId = '';
  
  try {
    const { amount, currency, description, method, customerId, metadata, card, blik } = req.body;
    
    console.log('🔄 Processing payment:', { method, amount, currency, description });
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    if (!method || !PAYMENT_CONFIGS[method]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }
    
    const config = PAYMENT_CONFIGS[method];
    if (!config.currencies.includes(currency || 'PLN')) {
      return res.status(400).json({
        success: false,
        message: `Payment method ${method} not supported for ${currency}`
      });
    }

    transactionId = generateTransactionId();
    const fees = calculateFees(method, amount);
    const totalAmount = amount + fees;

    // Simulate payment processing based on method
    let paymentResult;
    
    switch (method) {
      case 'stripe':
        if (card && (!card.number || !card.expiry || !card.cvc)) {
          throw new Error('Invalid card details');
        }
        paymentResult = {
          id: transactionId,
          status: 'succeeded',
          clientSecret: `pi_${transactionId}_secret_test`
        };
        break;
        
      case 'blik':
        if (!blik || !blik.code || !/^\d{6}$/.test(blik.code)) {
          throw new Error('Invalid BLIK code format');
        }
        paymentResult = {
          id: transactionId,
          status: 'succeeded',
          blik_code: blik.code
        };
        break;
        
      case 'przelewy24':
        paymentResult = {
          id: transactionId,
          status: 'pending',
          redirectUrl: `https://sandbox.przelewy24.pl/trnRequest/${transactionId}`
        };
        break;
        
      case 'paypal':
        paymentResult = {
          id: transactionId,
          status: 'pending',
          redirectUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${transactionId}`
        };
        break;
        
      case 'payu':
        paymentResult = {
          id: transactionId,
          status: 'pending',
          redirectUrl: `https://secure.snd.payu.com/pl/standard/user/oauth/authorize?response_type=code&client_id=test&redirect_uri=${encodeURIComponent('http://localhost:8080/api/payments/payu/callback')}&state=${transactionId}`
        };
        break;
        
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }

    // Store payment intent
    const paymentIntent = {
      id: transactionId,
      amount,
      currency: currency || 'PLN',
      description,
      customerId,
      metadata,
      status: paymentResult.status,
      method,
      fees,
      totalAmount,
      created: new Date(),
      clientSecret: paymentResult.clientSecret,
      redirectUrl: paymentResult.redirectUrl
    };

    paymentIntents.set(transactionId, paymentIntent);

    // Track analytics
    const processingTime = Date.now() - startTime;
    paymentAnalytics.push({
      transactionId,
      method,
      amount,
      currency: currency || 'PLN',
      status: paymentResult.status,
      processingTime,
      fees,
      userId: customerId,
      metadata,
      timestamp: new Date()
    });

    console.log('✅ Payment processed successfully:', transactionId);

    res.json({
      success: true,
      paymentIntent,
      transactionId,
      clientSecret: paymentResult.clientSecret,
      redirectUrl: paymentResult.redirectUrl
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error';
    
    console.error('❌ Payment processing failed:', errorMessage);

    // Track failed analytics
    paymentAnalytics.push({
      transactionId: transactionId || 'unknown',
      method: req.body.method,
      amount: req.body.amount,
      currency: req.body.currency || 'PLN',
      status: 'failed',
      processingTime,
      fees: 0,
      userId: req.body.customerId,
      metadata: { ...req.body.metadata, error: errorMessage },
      timestamp: new Date()
    });

    res.status(500).json({
      success: false,
      message: errorMessage,
      paymentIntent: {
        id: transactionId || `failed_${Date.now()}`,
        amount: req.body.amount,
        currency: req.body.currency || 'PLN',
        description: req.body.description,
        status: 'failed',
        created: new Date()
      }
    });
  }
});

// GET /api/payments/status/:id - Get payment status
app.get('/api/payments/status/:id', (req, res) => {
  try {
    const paymentIntent = paymentIntents.get(req.params.id);
    
    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      paymentIntent
    });
  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/payments/analytics - Get payment analytics
app.get('/api/payments/analytics', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const analytics = paymentAnalytics
      .slice(-limit)
      .slice(offset, offset + limit);

    const summary = {
      totalTransactions: paymentAnalytics.length,
      successfulTransactions: paymentAnalytics.filter(a => a.status === 'succeeded').length,
      totalAmount: paymentAnalytics.reduce((sum, a) => sum + (a.amount || 0), 0),
      averageProcessingTime: paymentAnalytics.length > 0 ? 
        paymentAnalytics.reduce((sum, a) => sum + (a.processingTime || 0), 0) / paymentAnalytics.length : 0,
      methodBreakdown: paymentAnalytics.reduce((acc, a) => {
        acc[a.method] = (acc[a.method] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      analytics,
      summary,
      pagination: {
        limit,
        offset,
        total: paymentAnalytics.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enhanced business registration endpoint
app.post('/api/auth/register/business', (req, res) => {
  console.log('🏢 Business registration request received');
  console.log('Request body keys:', Object.keys(req.body));
  
  const { 
    name, email, password, businessName, businessDescription, category,
    companyMotto, establishedYear, teamSize, spokenLanguages, paymentMethods,
    certifications, sustainabilityInfo, kvkNumber, btwNumber, iban,
    street, postalCode, city, phone, website, googleMapsUrl, otherLocations,
    instagram, facebook, twitter, linkedin, tiktokUrl, otherLinkUrl
  } = req.body;
  
  // Enhanced validation
  if (!name || !email || !password || !businessName) {
    console.log('❌ Validation failed - missing required fields');
    return res.status(400).json({
      success: false,
      error: 'Name, email, password and business name are required'
    });
  }

  if (!email.includes('@')) {
    console.log('❌ Validation failed - invalid email');
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address'
    });
  }

  if (!password || password.length < 6) {
    console.log('❌ Validation failed - weak password');
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }

  // Check if email already exists
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    console.log('❌ Email already exists:', email);
    return res.status(400).json({
      success: false,
      error: 'Email address is already registered'
    });
  }

  // Create comprehensive business profile
  const businessId = Date.now() + 1;
  const userId = Date.now();
  
  const business = {
    id: businessId,
    nameKey: businessName,
    descriptionKey: businessDescription || '',
    category: category || 'other',
    owner: name,
    ownerId: userId,
    
    // Basic info
    companyMotto: companyMotto || '',
    establishedYear: establishedYear || null,
    teamSize: teamSize || '',
    spokenLanguages: spokenLanguages || '',
    paymentMethods: paymentMethods || '',
    certifications: certifications || '',
    sustainabilityInfo: sustainabilityInfo || '',
    
    // Legal info
    kvkNumber: kvkNumber || '',
    btwNumber: btwNumber || '',
    iban: iban || '',
    
    // Address
    address: {
      street: street || '',
      postalCode: postalCode || '',
      city: city || 'Den Haag',
      country: 'Netherlands'
    },
    
    // Contact
    phone: phone || '',
    website: website || '',
    email: email,
    googleMapsUrl: googleMapsUrl || '',
    otherLocations: otherLocations || [],
    
    // Social media
    socialMedia: {
      instagram: instagram || '',
      facebook: facebook || '',
      twitter: twitter || '',
      linkedin: linkedin || '',
      tiktokUrl: tiktokUrl || '',
      otherLinkUrl: otherLinkUrl || ''
    },
    
    // System fields
    isVerified: false,
    rating: Math.random() * 2 + 3, // Random rating between 3-5 for demo
    reviewCount: Math.floor(Math.random() * 50),
    adCount: 0,
    logoUrl: '',
    coverImageUrl: '',
    openingHours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '10:00-16:00',
      sunday: 'closed'
    },
    services: [],
    subscriptionStatus: 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const user = {
    id: userId,
    name: name,
    email: email,
    businessId: businessId,
    role: 'business_owner',
    isVerified: false,
    createdAt: new Date().toISOString()
  };

  // Store in mock database
  businesses.push(business);
  users.push(user);

  console.log('✅ Business registration successful:', {
    businessName: business.nameKey,
    category: business.category,
    owner: user.name,
    email: user.email,
    totalBusinesses: businesses.length
  });
  
  res.json({
    success: true,
    message: 'Business registered successfully',
    token: `mock-business-jwt-token-${userId}`,
    user: user,
    business: business
  });
});

// GET business profile endpoint
app.get('/api/businesses/:id', (req, res) => {
  console.log('📋 Getting business profile:', req.params.id);
  
  const business = businesses.find(b => b.id == req.params.id);
  
  if (!business) {
    return res.status(404).json({
      success: false,
      error: 'Business not found'
    });
  }
  
  res.json({
    success: true,
    business: business
  });
});

// GET all businesses endpoint (for browsing)
app.get('/api/businesses', (req, res) => {
  console.log('📋 Getting all businesses, query:', req.query);
  
  const { category, city, limit = 10 } = req.query;
  let filteredBusinesses = [...businesses];
  
  if (category && category !== 'all') {
    filteredBusinesses = filteredBusinesses.filter(b => b.category === category);
  }
  
  if (city) {
    filteredBusinesses = filteredBusinesses.filter(b => 
      b.address.city.toLowerCase().includes(city.toLowerCase())
    );
  }
  
  // Sort by rating and creation date
  filteredBusinesses.sort((a, b) => {
    if (a.rating !== b.rating) return b.rating - a.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  const paginatedBusinesses = filteredBusinesses.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    businesses: paginatedBusinesses,
    total: filteredBusinesses.length,
    filters: { category, city, limit }
  });
});

// ================================
// ENHANCED GEOLOCATION API ENDPOINTS
// ================================

// GET /api/geolocation/routes - Calculate route between two points
app.post('/api/geolocation/routes', async (req, res) => {
  try {
    const { start, destination, mode = 'driving', language = 'pl', avoidTraffic = true } = req.body;
    
    console.log('🗺️ Calculating route:', { start, destination, mode, language });
    
    // Validation
    if (!start || !Array.isArray(start) || start.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start coordinates'
      });
    }
    
    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }
    
    // For demo, destination can be coordinates or address
    let destCoords;
    if (Array.isArray(destination)) {
      destCoords = destination;
    } else {
      // Simulate geocoding for address
      destCoords = [50.0647 + (Math.random() - 0.5) * 0.02, 19.9450 + (Math.random() - 0.5) * 0.02];
    }
    
    const routeKey = `${start.join(',')}_${destCoords.join(',')}_${mode}`;
    
    // Check cache
    if (routeCache.has(routeKey)) {
      const cached = routeCache.get(routeKey);
      console.log('📦 Route served from cache');
      return res.json({
        success: true,
        ...cached,
        cached: true
      });
    }
    
    // Generate route
    const route = generateRouteSteps(start, destCoords, mode);
    
    // Add traffic information if requested
    const trafficInfo = {
      incidents: [
        {
          id: 'traffic_1',
          type: 'construction',
          location: [start[0] + 0.005, start[1] + 0.005],
          description: 'Roboty drogowe na ul. Floriańskiej',
          severity: 'moderate',
          estimatedClearTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
        }
      ],
      congestionLevel: 'moderate',
      estimatedDelay: avoidTraffic ? 180 : 0
    };
    
    // Generate alternatives
    const alternatives = [
      {
        id: 'alt_1',
        name: 'Trasa szybka',
        totalDistance: route.totalDistance * 0.9,
        totalDuration: route.totalDuration * 0.8,
        savings: { time: -120, distance: 200, fuel: 0.5 },
        characteristics: ['autostrada', 'płatna']
      },
      {
        id: 'alt_2',
        name: 'Trasa malownicza',
        totalDistance: route.totalDistance * 1.2,
        totalDuration: route.totalDuration * 1.3,
        savings: { time: 240, distance: -400, fuel: -0.8 },
        characteristics: ['lokalne drogi', 'bezpłatna', 'malownicza']
      }
    ];
    
    const routeData = {
      steps: route.steps,
      totalDistance: route.totalDistance,
      totalDuration: route.totalDuration,
      traffic: trafficInfo,
      alternatives,
      mode,
      language
    };
    
    // Cache the route
    routeCache.set(routeKey, routeData);
    
    console.log('✅ Route calculated successfully');
    res.json({
      success: true,
      ...routeData
    });
    
  } catch (error) {
    console.error('❌ Error calculating route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/geolocation/geofences - Get all geofence zones
app.get('/api/geolocation/geofences', (req, res) => {
  try {
    const zones = Array.from(geofenceZones.values());
    console.log('🛡️ Returning geofence zones:', zones.length);
    
    res.json({
      success: true,
      zones
    });
  } catch (error) {
    console.error('❌ Error getting geofences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/geolocation/geofences - Create new geofence zone
app.post('/api/geolocation/geofences', (req, res) => {
  try {
    const { name, type, center, radius, polygon, category, notifications, customMessage, activeHours } = req.body;
    
    console.log('🛡️ Creating geofence zone:', { name, type, category });
    
    // Validation
    if (!name || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and category are required'
      });
    }
    
    if (type === 'circular' && (!center || !radius)) {
      return res.status(400).json({
        success: false,
        message: 'Center and radius are required for circular geofences'
      });
    }
    
    if (type === 'polygon' && (!polygon || !Array.isArray(polygon))) {
      return res.status(400).json({
        success: false,
        message: 'Polygon coordinates are required for polygon geofences'
      });
    }
    
    const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const zone = {
      id: zoneId,
      name,
      type,
      center: type === 'circular' ? center : undefined,
      radius: type === 'circular' ? radius : undefined,
      polygon: type === 'polygon' ? polygon : undefined,
      category,
      notifications: notifications !== false,
      customMessage: customMessage || '',
      activeHours,
      triggers: [
        { event: 'enter', action: 'notification', config: {} },
        { event: 'exit', action: 'analytics', config: {} }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    geofenceZones.set(zoneId, zone);
    
    console.log('✅ Geofence zone created:', zoneId);
    res.json({
      success: true,
      zone
    });
    
  } catch (error) {
    console.error('❌ Error creating geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/geolocation/geofences/:id - Remove geofence zone
app.delete('/api/geolocation/geofences/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!geofenceZones.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Geofence zone not found'
      });
    }
    
    geofenceZones.delete(id);
    
    console.log('🗑️ Geofence zone deleted:', id);
    res.json({
      success: true,
      message: 'Geofence zone deleted'
    });
    
  } catch (error) {
    console.error('❌ Error deleting geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/geolocation/analytics - Get location analytics
app.get('/api/geolocation/analytics', (req, res) => {
  try {
    console.log('📊 Generating location analytics');
    
    // Generate mock analytics data
    const analytics = {
      totalVisits: 15647 + Math.floor(Math.random() * 1000),
      uniqueUsers: 8432 + Math.floor(Math.random() * 500),
      averageStayTime: 1847 + Math.floor(Math.random() * 300),
      popularTimes: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        visits: Math.floor(Math.random() * 500) + 100
      })),
      heatmapData: generateHeatmapData(),
      demographics: {
        ageGroups: {
          '18-24': 1245 + Math.floor(Math.random() * 200),
          '25-34': 2876 + Math.floor(Math.random() * 300),
          '35-44': 2134 + Math.floor(Math.random() * 250),
          '45-54': 1567 + Math.floor(Math.random() * 200),
          '55+': 610 + Math.floor(Math.random() * 100)
        },
        interests: {
          'kultura': 3456 + Math.floor(Math.random() * 400),
          'gastronomia': 4123 + Math.floor(Math.random() * 500),
          'rozrywka': 2765 + Math.floor(Math.random() * 350),
          'zakupy': 3298 + Math.floor(Math.random() * 400),
          'sport': 2005 + Math.floor(Math.random() * 250)
        }
      },
      trajectories: []
    };
    
    console.log('✅ Analytics generated successfully');
    res.json({
      success: true,
      analytics
    });
    
  } catch (error) {
    console.error('❌ Error generating analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/geolocation/track - Track user location (for analytics)
app.post('/api/geolocation/track', (req, res) => {
  try {
    const { userId, coordinates, timestamp, purpose } = req.body;
    
    console.log('📍 Tracking user location:', { userId, coordinates, purpose });
    
    // Store trajectory data
    if (!userTrajectories.has(userId)) {
      userTrajectories.set(userId, []);
    }
    
    const trajectory = userTrajectories.get(userId);
    trajectory.push({
      coordinates,
      timestamp: timestamp || new Date(),
      purpose
    });
    
    // Keep only last 1000 points per user
    if (trajectory.length > 1000) {
      trajectory.splice(0, trajectory.length - 1000);
    }
    
    res.json({
      success: true,
      message: 'Location tracked'
    });
    
  } catch (error) {
    console.error('❌ Error tracking location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to generate heatmap data
function generateHeatmapData() {
  const center = [50.0647, 19.9450]; // Kraków center
  const heatmapPoints = [];
  
  for (let i = 0; i < 100; i++) {
    const lat = center[0] + (Math.random() - 0.5) * 0.02;
    const lng = center[1] + (Math.random() - 0.5) * 0.02;
    const intensity = Math.random();
    
    heatmapPoints.push({ lat, lng, intensity });
  }
  
  return heatmapPoints;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, '127.0.0.1', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    return;
  }
  
  console.log(`🎯 ENHANCED BACKEND URUCHOMIONY!`);
  console.log(`📡 Server: http://127.0.0.1:${PORT}`);
  console.log(`🌐 CORS: http://localhost:3000, http://localhost:5173, http://localhost:5177`);
  console.log(`✅ Enhanced backend running on port ${PORT}`);
  console.log(`🕒 Started at: ${new Date().toLocaleString('pl-PL')}`);
  console.log(`💾 Mock database ready (${businesses.length} businesses, ${users.length} users)`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/auth/register/business`);
  console.log(`   GET  /api/businesses`);
  console.log(`   GET  /api/businesses/:id`);
  console.log(`   💳 Payment System:`);
  console.log(`      GET  /api/payments/methods`);
  console.log(`      POST /api/payments/process`);
  console.log(`      GET  /api/payments/status/:id`);
  console.log(`      GET  /api/payments/analytics`);
  console.log(`   📍 Geolocation System:`);
  console.log(`      POST /api/geolocation/routes`);
  console.log(`      GET  /api/geolocation/geofences`);
  console.log(`      POST /api/geolocation/geofences`);
  console.log(`      DELETE /api/geolocation/geofences/:id`);
  console.log(`      GET  /api/geolocation/analytics`);
  console.log(`      POST /api/geolocation/track`);
});