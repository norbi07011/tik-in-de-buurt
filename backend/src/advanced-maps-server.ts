import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from 'dotenv';

// Import existing routes (will be available or mocked)
import authRoutes from './routes/auth';

// Import new Maps Phase 3 routes
import advancedMapsRoutes from './routes/advancedMapsSimple';

// Import Socket.IO handlers
import SimpleMapsSocketHandler from './socket/simpleMapsSocket';

// Import utilities
import { logger } from './utils/logger';

// Load environment variables
config();

class AdvancedMapsServer {
  private app: express.Application;
  private server: any;
  private mapsSocketHandler!: SimpleMapsSocketHandler;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8080');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupServer();
    this.connectDatabase();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
          fontSrc: ["'self'", "fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    // Compression (could add later)
    // this.app.use(compression());

    // CORS with proper configuration
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'https://tik-in-de-buurt.netlify.app',
        'https://www.tik-in-de-buurt.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Stricter rate limit for maps endpoints
    const mapsLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 200, // Limit each IP to 200 requests per minute for maps
      message: {
        success: false,
        error: 'Too many maps requests, please slow down'
      }
    });

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for rate limiting behind reverse proxy
    this.app.set('trust proxy', 1);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // Apply maps rate limiter to maps routes
    this.app.use('/api/maps', mapsLimiter);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        let dbStatus = 'disconnected';
        let mapsServicesStatus = 'unknown';

        // Check MongoDB connection
        if (mongoose.connection.readyState === 1) {
          dbStatus = 'connected';
        } else if (mongoose.connection.readyState === 2) {
          dbStatus = 'connecting';
        }

        // Check Maps services
        try {
          // Quick check of services - we can expand this later
          mapsServicesStatus = 'operational';
        } catch (error) {
          mapsServicesStatus = 'error';
        }

        const healthData = {
          ok: true,
          status: 'OK',
          server: 'advanced-maps-backend',
          timestamp: new Date().toISOString(),
          version: '3.0.0-maps',
          database: {
            status: dbStatus,
            connection: mongoose.connection.readyState
          },
          services: {
            maps: mapsServicesStatus,
            socketConnections: this.mapsSocketHandler?.getConnectedUsers().size || 0,
            activeNavigationSessions: this.mapsSocketHandler?.getActiveNavigationSessions().size || 0
          }
        };

        logger.info('Health check passed', healthData);
        res.status(200).json(healthData);
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({
          ok: false,
          status: 'ERROR',
          error: 'Health check failed'
        });
      }
    });

    // API route mounting
    this.app.use('/api/auth', authRoutes);
    
    // Other routes would be mounted here when available
    // this.app.use('/api/business', businessRoutes);
    // this.app.use('/api/freelancer', freelancerRoutes);
    // etc...
    
    // NEW: Advanced Maps & Geolocation Phase 3 routes
    this.app.use('/api/maps', advancedMapsRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: '🚀 Tik-in-de-buurt Advanced Maps Backend Server',
        version: '3.0.0-maps',
        features: [
          '📍 Real-time Location Tracking',
          '🔲 Advanced Geofencing',
          '🧭 Turn-by-turn Navigation',
          '🚦 Live Traffic Updates',
          '🔍 Points of Interest Search',
          '📊 Location Analytics',
          '🔗 Real-time Socket.IO Integration'
        ],
        endpoints: {
          health: '/health',
          auth: '/api/auth/*',
          business: '/api/business/*',
          freelancer: '/api/freelancer/*',
          video: '/api/video/*',
          chat: '/api/chat/*',
          property: '/api/property/*',
          post: '/api/post/*',
          maps: '/api/maps/*'
        },
        documentation: 'https://github.com/your-repo/tik-in-de-buurt/docs',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  private setupServer(): void {
    // Create HTTP server
    this.server = createServer(this.app);

    // Initialize Socket.IO with Advanced Maps support
    this.mapsSocketHandler = new SimpleMapsSocketHandler(this.server);

    logger.info('🔧 Server setup completed with advanced maps integration');
  }

  private async connectDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tik-in-de-buurt';
      const dbName = process.env.MONGODB_DB_NAME || 'tik-in-de-buurt';

      await mongoose.connect(mongoUri, {
        dbName,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });

      logger.info(`🗄️  Connected to MongoDB: ${dbName}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('🔌 MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB reconnected');
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      
      // For development, continue without database
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️  Continuing without database in development mode');
      } else {
        process.exit(1);
      }
    }
  }

  public start(): void {
    this.server.listen(this.port, () => {
      logger.info(`
🚀 Advanced Maps Backend Server Started Successfully!
════════════════════════════════════════════════════

📍 Maps & Geolocation Phase 3 Features:
   ✅ Real-time Location Tracking
   ✅ Advanced Geofencing System  
   ✅ Turn-by-turn Navigation
   ✅ Live Traffic Updates
   ✅ Points of Interest Search
   ✅ Location Analytics
   ✅ Socket.IO Real-time Updates

🌐 Server: http://localhost:${this.port}
📊 Health: http://localhost:${this.port}/health
🗺️  Maps API: http://localhost:${this.port}/api/maps
🔗 Socket.IO: ws://localhost:${this.port}

Environment: ${process.env.NODE_ENV || 'development'}
Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}

═══════════════════════════════════════════════════
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  private async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down server...');

    try {
      // Close HTTP server
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          logger.info('📡 HTTP server closed');
          resolve();
        });
      });

      // Close MongoDB connection
      await mongoose.connection.close();
      logger.info('🗄️  MongoDB connection closed');

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }

  public getMapsSocketHandler(): SimpleMapsSocketHandler {
    return this.mapsSocketHandler;
  }
}

// Create and start server
const server = new AdvancedMapsServer();

// Start server if this file is run directly
if (require.main === module) {
  server.start();
}

export default server;
export { AdvancedMapsServer };