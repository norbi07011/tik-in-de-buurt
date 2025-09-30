#!/usr/bin/env node

// Stabilny backend do testów - system uwierzytelniania MongoDB
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import konfiguracji i routów
const { config } = require('./dist/config/env');
const authRoutes = require('./dist/routes/auth');
const { connectMongo, isConnectedToMongo, disconnectMongo } = require('./dist/db/mongo');

const app = express();
const PORT = config.PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes.default || authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: process.env.DB_ENABLED === 'true' ? 'MongoDB Atlas' : 'JSON Storage',
    port: PORT
  });
});

// Główna strona
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tik-in-de-buurt API Server',
    version: '1.0.0',
    endpoints: ['/api/auth', '/health'],
    database: process.env.DB_ENABLED === 'true' ? 'MongoDB Atlas Connected' : 'JSON Storage Mode'
  });
});

// Uruchomienie serwera
async function startServer() {
  try {
    console.log('🚀 Starting MongoDB Authentication Server...');
    
    // Połącz z MongoDB
    if (config.DB_ENABLED) {
      console.log('📊 Connecting to MongoDB Atlas...');
      await connectMongo();
      console.log('✅ MongoDB Atlas connected!');
    } else {
      console.log('📂 Running in JSON storage mode');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎯 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${config.DB_ENABLED ? 'MongoDB Atlas' : 'JSON Storage'}`);
      console.log(`🔧 Environment: ${config.NODE_ENV}`);
      console.log('📋 Available endpoints:');
      console.log('   GET  /health - Server status');
      console.log('   POST /api/auth/register - User registration');
      console.log('   POST /api/auth/login - User login');
      console.log('   POST /api/auth/register/business - Business registration');
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Obsługa zamknięcia
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (config.DB_ENABLED && isConnectedToMongo()) {
    await disconnectMongo();
    console.log('📦 MongoDB connection closed');
  }
  process.exit(0);
});

startServer();