import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Models
import User, { IUser } from './models/User';
import Business, { IBusiness } from './models/Business';
import Post, { IPost } from './models/Post';

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const USE_MOCK_API = process.env.USE_MOCK_API === 'true';

// Log configuration at boot
console.log('[BOOT] ========================================');
console.log('[BOOT] USE_MOCK_API:', USE_MOCK_API);
console.log('[BOOT] MONGODB_URI exists:', !!MONGODB_URI);
console.log('[BOOT] JWT_SECRET configured:', !!JWT_SECRET);
console.log('[BOOT] ========================================');

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5177',
    'http://localhost:5178',
    process.env.FRONTEND_URL || 'http://localhost:5177'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// MONGODB CONNECTION
// ============================================

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error('[DB] ❌ MONGODB_URI not configured in .env');
    process.exit(1);
  }

  try {
    console.log('[DB] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] ✅ MongoDB connected successfully');
    console.log('[DB] Database:', mongoose.connection.db?.databaseName || 'unknown');
  } catch (error: any) {
    console.error('[DB] ❌ MongoDB connection error:', error.message);
    console.error('[DB] Stack:', error.stack);
    process.exit(1);
  }
};

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('[DB] ❌ MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('[DB] ⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB] ✅ MongoDB reconnected');
});

// ============================================
// AUTH MIDDLEWARE
// ============================================

interface AuthRequest extends Omit<Request, 'user'> {
  user?: IUser;
}

const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (jwtError: any) {
      console.error('[AUTH] JWT verification error:', jwtError.message);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  } catch (error: any) {
    console.error('[AUTH] Middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  ) as string;
};

const sanitizeUser = (user: IUser) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    userType: user.userType,
    businessId: user.businessId?.toString() || null,
    isVerified: user.isVerified,
    avatar: user.avatar,
    createdAt: user.createdAt
  };
};

const sanitizeBusiness = (business: IBusiness) => {
  return {
    id: (business._id as mongoose.Types.ObjectId).toString(),
    ownerId: business.ownerId.toString(),
    name: business.name,
    description: business.description,
    category: business.category,
    city: business.address?.city,
    address: business.address,
    logoUrl: business.logoUrl,
    rating: business.rating,
    reviewCount: business.reviewCount,
    status: business.subscriptionStatus,
    createdAt: business.createdAt
  };
};

// ============================================
// AUTH ENDPOINTS (REAL - NO MOCKS)
// ============================================

// POST /api/auth/register - Register new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  console.log('[AUTH] POST /api/auth/register');
  
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('[AUTH] ❌ Email already exists:', email);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      userType: 'business',
      isVerified: false,
      isActive: true
    });

    console.log('[AUTH] ✅ User created:', user._id);

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      token
    });
  } catch (error: any) {
    console.error('[AUTH] ❌ Registration error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  console.log('[AUTH] POST /api/auth/login');
  
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('[AUTH] ❌ User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // CRITICAL: Verify password with bcrypt (fixes "login with anything" bug)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('[AUTH] ❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    console.log('[AUTH] ✅ Login successful:', email);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      token
    });
  } catch (error: any) {
    console.error('[AUTH] ❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/auth/me - Get current user
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('[AUTH] GET /api/auth/me');
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(req.user)
    });
  } catch (error: any) {
    console.error('[AUTH] ❌ Get user error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ============================================
// BUSINESS ENDPOINTS (REAL)
// ============================================

// POST /api/business - Create business (requires auth)
app.post('/api/business', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('[BUSINESS] POST /api/business');
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { name, description, category, city, street, postalCode, country } = req.body;

    // Validation
    if (!name || !category || !city) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Name, category, and city are required'
      });
    }

    // Check if user already has a business
    if (req.user.businessId) {
      const existingBusiness = await Business.findById(req.user.businessId);
      if (existingBusiness) {
        console.log('[BUSINESS] ⚠️ User already has business:', req.user.businessId);
        return res.status(200).json({
          success: true,
          business: sanitizeBusiness(existingBusiness),
          message: 'Business already exists'
        });
      }
    }

    // Create business
    const business = await Business.create({
      ownerId: req.user._id,
      name,
      description: description || '',
      category,
      address: {
        street: street || '',
        postalCode: postalCode || '',
        city,
        country: country || 'Netherlands'
      },
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      services: [],
      paymentMethods: [],
      spokenLanguages: ['nl', 'en'],
      socialMedia: {},
      subscriptionStatus: 'active'
    });

    console.log('[BUSINESS] ✅ Business created:', business._id);

    // Update user with businessId
    req.user.businessId = business._id as mongoose.Types.ObjectId;
    await req.user.save();

    console.log('[BUSINESS] ✅ User updated with businessId');

    res.status(201).json({
      success: true,
      business: sanitizeBusiness(business)
    });
  } catch (error: any) {
    console.error('[BUSINESS] ❌ Create error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/business/me - Get user's business
app.get('/api/business/me', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('[BUSINESS] GET /api/business/me');
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (!req.user.businessId) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'User has no business'
      });
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Business not found'
      });
    }

    res.status(200).json({
      success: true,
      business: sanitizeBusiness(business)
    });
  } catch (error: any) {
    console.error('[BUSINESS] ❌ Get error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ============================================
// POST ENDPOINTS (TEXT FOR START)
// ============================================

// POST /api/posts - Create post (requires auth)
app.post('/api/posts', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('[POSTS] POST /api/posts');
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { title, body, type, city } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Title is required'
      });
    }

    // Create post
    const post = await Post.create({
      authorId: req.user._id,
      businessId: req.user.businessId || undefined,
      type: type || 'text',
      title,
      body: body || '',
      city: city || null,
      likes: 0,
      comments: 0,
      views: 0,
      isPublished: true,
      publishedAt: new Date()
    });

    console.log('[POSTS] ✅ Post created:', post._id);

    // Populate author info
    await post.populate('authorId', 'name avatar');

    res.status(201).json({
      success: true,
      post: {
        id: post._id.toString(),
        authorId: post.authorId,
        businessId: post.businessId?.toString() || null,
        type: post.type,
        title: post.title,
        body: post.body,
        city: post.city,
        likes: post.likes,
        comments: post.comments,
        views: post.views,
        createdAt: post.createdAt
      }
    });
  } catch (error: any) {
    console.error('[POSTS] ❌ Create error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/posts - List posts
app.get('/api/posts', async (req: Request, res: Response) => {
  console.log('[POSTS] GET /api/posts');
  
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const city = req.query.city as string;

    let query: any = { isPublished: true };
    if (city) {
      query.city = city;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'name avatar')
      .populate('businessId', 'name logoUrl');

    console.log('[POSTS] ✅ Found', posts.length, 'posts');

    res.status(200).json({
      success: true,
      posts: posts.map(post => ({
        id: post._id.toString(),
        author: post.authorId,
        business: post.businessId || null,
        type: post.type,
        title: post.title,
        body: post.body,
        city: post.city,
        likes: post.likes,
        comments: post.comments,
        views: post.views,
        createdAt: post.createdAt
      })),
      total: posts.length
    });
  } catch (error: any) {
    console.error('[POSTS] ❌ List error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ============================================
// GEOCODING & TRENDING (FROM ENHANCED-SERVER)
// ============================================

// POST /api/locations/geocode - Geocode address
app.post('/api/locations/geocode', (req: Request, res: Response) => {
  console.log('[GEOCODE] POST /api/locations/geocode');
  const { address, city, postalCode, country } = req.body || {};
  
  console.log('[GEOCODE] Input:', { address, city, postalCode, country });
  
  // Simple city-based geocoding
  let lat = 52.0, lng = 5.0; // Netherlands fallback
  let formatted = 'Netherlands (fallback)';
  
  if (city) {
    const cityLower = city.toLowerCase();
    if (cityLower.includes('amsterdam')) {
      lat = 52.3676;
      lng = 4.9041;
      formatted = 'Amsterdam, Netherlands';
    } else if (cityLower.includes('rotterdam')) {
      lat = 51.9244;
      lng = 4.4777;
      formatted = 'Rotterdam, Netherlands';
    } else if (cityLower.includes('haag') || cityLower.includes('hague')) {
      lat = 52.0705;
      lng = 4.3007;
      formatted = 'Den Haag, Netherlands';
    } else if (cityLower.includes('utrecht')) {
      lat = 52.0907;
      lng = 5.1214;
      formatted = 'Utrecht, Netherlands';
    } else if (cityLower.includes('eindhoven')) {
      lat = 51.4416;
      lng = 5.4697;
      formatted = 'Eindhoven, Netherlands';
    } else {
      formatted = `${city}, Netherlands`;
    }
  }
  
  const result = {
    lat,
    lng,
    formatted,
    source: 'mock',
    input: { address, city, postalCode, country }
  };
  
  console.log('[GEOCODE] ✅ Result:', result);
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(result);
});

// POST /api/locations/geocode/batch - Batch geocode
app.post('/api/locations/geocode/batch', (req: Request, res: Response) => {
  console.log('[GEOCODE_BATCH] POST /api/locations/geocode/batch');
  const { items } = req.body || { items: [] };
  
  const results = items.map((item: any, index: number) => {
    const { address, city, postalCode, country } = item;
    
    let lat = 52.0, lng = 5.0;
    let formatted = 'Netherlands (fallback)';
    
    if (city) {
      const cityLower = city.toLowerCase();
      if (cityLower.includes('amsterdam')) {
        lat = 52.3676 + (Math.random() - 0.5) * 0.1;
        lng = 4.9041 + (Math.random() - 0.5) * 0.1;
        formatted = `${city}, Netherlands`;
      } else if (cityLower.includes('rotterdam')) {
        lat = 51.9244 + (Math.random() - 0.5) * 0.1;
        lng = 4.4777 + (Math.random() - 0.5) * 0.1;
        formatted = `${city}, Netherlands`;
      } else {
        lat = 52.0 + (Math.random() - 0.5) * 1.0;
        lng = 5.0 + (Math.random() - 0.5) * 1.0;
        formatted = `${city}, Netherlands`;
      }
    }
    
    return { lat, lng, formatted, source: 'mock', index };
  });
  
  console.log('[GEOCODE_BATCH] ✅ Processed', results.length, 'items');
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ results });
});

// GET /api/search/trending - Get trending searches
app.get('/api/search/trending', (req: Request, res: Response) => {
  console.log('[TRENDING] GET /api/search/trending');
  
  const trendingItems = [
    { id: '1', title: 'Restaurants in Amsterdam', score: 95, category: 'restaurants' },
    { id: '2', title: 'Koffie & Thee', score: 88, category: 'cafes' },
    { id: '3', title: 'Local Bakeries', score: 82, category: 'bakeries' },
    { id: '4', title: 'Fitness Centers', score: 76, category: 'sports' },
    { id: '5', title: 'Hair Salons', score: 71, category: 'beauty' },
    { id: '6', title: 'Auto Repair', score: 68, category: 'services' },
    { id: '7', title: 'Real Estate', score: 65, category: 'real-estate' },
    { id: '8', title: 'Pet Shops', score: 59, category: 'pets' }
  ];
  
  console.log('[TRENDING] ✅ Returning', trendingItems.length, 'items');
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ items: trendingItems });
});

// ============================================
// HEALTH & UTILITY ENDPOINTS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR] 💥 Unhandled error:', err.message);
  console.error('[ERROR] Stack:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Handle 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log('[SERVER] ========================================');
      console.log('[SERVER] 🚀 REAL BACKEND STARTED!');
      console.log('[SERVER] 📡 Server: http://localhost:' + PORT);
      console.log('[SERVER] 🌐 CORS: localhost:3000, :5173, :5177, :5178');
      console.log('[SERVER] 💾 Database: MongoDB Atlas (REAL)');
      console.log('[SERVER] 🕒 Started at:', new Date().toLocaleString('pl-PL'));
      console.log('[SERVER] ========================================');
      console.log('[SERVER] 📋 Available endpoints:');
      console.log('[SERVER]    GET  /health');
      console.log('[SERVER]    🔐 Auth:');
      console.log('[SERVER]       POST /api/auth/register');
      console.log('[SERVER]       POST /api/auth/login');
      console.log('[SERVER]       GET  /api/auth/me (requires auth)');
      console.log('[SERVER]    🏢 Business:');
      console.log('[SERVER]       POST /api/business (requires auth)');
      console.log('[SERVER]       GET  /api/business/me (requires auth)');
      console.log('[SERVER]    📝 Posts:');
      console.log('[SERVER]       POST /api/posts (requires auth)');
      console.log('[SERVER]       GET  /api/posts');
      console.log('[SERVER]    📍 Geocoding:');
      console.log('[SERVER]       POST /api/locations/geocode');
      console.log('[SERVER]       POST /api/locations/geocode/batch');
      console.log('[SERVER]    🔍 Search:');
      console.log('[SERVER]       GET  /api/search/trending');
      console.log('[SERVER] ========================================');
    });
  } catch (error: any) {
    console.error('[SERVER] ❌ Failed to start:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[SERVER] 🛑 Received SIGINT, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[SERVER] 🛑 Received SIGTERM, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();
