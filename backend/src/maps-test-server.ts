import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from 'dotenv';

// Import utilities
import { logger } from './utils/logger';

// Load environment variables
config();

const app = express();
const server = createServer(app);
const port = 8080;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tik-in-de-buurt.netlify.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'OK',
    server: 'maps-phase-3-backend',
    timestamp: new Date().toISOString(),
    version: '3.0.0-maps',
    features: [
      '📍 Real-time Location Tracking',
      '🔲 Advanced Geofencing',
      '🧭 Turn-by-turn Navigation',
      '🚦 Live Traffic Updates',
      '🔍 Points of Interest Search',
      '📊 Location Analytics'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
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
      maps: '/api/maps/*'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Connect to database
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tik-in-de-buurt';
    const dbName = process.env.MONGODB_DB_NAME || 'tik-in-de-buurt';

    await mongoose.connect(mongoUri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info(`🗄️  Connected to MongoDB: ${dbName}`);
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️  Continuing without database in development mode');
    }
  }
}

// Start server
server.listen(port, async () => {
  await connectDatabase();
  
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

🌐 Server: http://localhost:${port}
📊 Health: http://localhost:${port}/health

Environment: ${process.env.NODE_ENV || 'development'}
Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}

Maps & Geolocation Phase 3 Backend is READY! 🗺️
═══════════════════════════════════════════════════
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Shutting down server...');
  server.close(() => {
    mongoose.connection.close();
    logger.info('✅ Server shut down gracefully');
    process.exit(0);
  });
});

export default app;