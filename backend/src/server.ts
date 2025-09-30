import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
// Force nodemon restart
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import configuration
import { config } from './config/env';
import { databaseManager } from './config/database';
import { connectMongo, isConnectedToMongo, isMockMode } from './db/mongo';

// Import routes and middleware
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import businessRoutes from './routes/businesses';
import videoRoutes from './routes/videos';
import videoAnalyticsRoutes from './routes/videoAnalytics';
import verificationRoutes from './routes/verification';
import uploadRoutes from './routes/upload';
import profileRoutes from './routes/profile';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import locationRoutes from './routes/locations';
import paymentRoutes from './routes/payments';
import discountRoutes from './routes/discountCodes';
import demoPaymentRoutes from './routes/demo-payments';
import advancedSearchRoutes from './routes/advancedSearch';
import { authenticateToken } from './middleware/auth';
import { databaseFallback } from './middleware/database';
import { SocketService } from './services/socketService';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const PORT = config.PORT || 3001;

// Initialize database connection (non-blocking)
console.log('🚀 Starting server initialization...');
databaseManager.connect().catch(err => {
  console.error('Database connection failed, continuing with fallback:', err.message);
});

// Initialize MongoDB Atlas connection
connectMongo().catch(err => {
  console.error('MongoDB Atlas connection failed, continuing in mock mode:', err.message);
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Database middleware
app.use(databaseFallback);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/video-analytics', videoAnalyticsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discount-codes', discountRoutes);
app.use('/api/demo-payments', demoPaymentRoutes);
app.use('/api/search', advancedSearchRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = databaseManager.getStatus();
  console.log('[Health] Check requested');
  res.status(200).json({ 
    ok: true,
    db: dbStatus.isConnected ? 'connected' : 'mock',
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    database: {
      connected: dbStatus.isConnected,
      mode: dbStatus.mode,
      state: dbStatus.connectionState,
      host: dbStatus.host,
      name: dbStatus.name,
      collections: dbStatus.collections,
      error: dbStatus.error
    },
    services: {
      email: config.email.enabled ? 'enabled' : 'mock',
      sms: 'mock', // TODO: check SMS service status
      socket: 'enabled',
      uploads: 'enabled'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON format',
      message: 'The request body contains invalid JSON'
    });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request entity too large',
      message: 'The request body is too large'
    });
  }
  
  return res.status(500).json({
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize Socket.IO
SocketService.initialize(io);

// Start server immediately
console.log(`🔥 PRÓBA URUCHOMIENIA SERWERA NA PORCIE ${PORT}...`);
const serverInstance = server.listen(Number(PORT), '0.0.0.0', () => {
  const dbStatus = databaseManager.getStatus();
  console.log(`🎯 SERWER DZIAŁA POPRAWNIE NA PORCIE ${PORT}!`);
  console.log(`[Server] listening on http://127.0.0.1:${PORT} (ENV: ${config.NODE_ENV})`);
  console.log(`[DB] mode: ${dbStatus.isConnected ? 'connected' : 'mock'}`);
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔌 Socket.IO server initialized`);
  console.log(`🔍 Server address:`, serverInstance.address());
});

server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
  }
});

// Global error handlers for unhandled exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development
  if (config.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  if (config.NODE_ENV === 'production') {
    process.exit(1);
  }
});

export { app, server, io };
export default app;