"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = require("cors");
// Load environment variables
require("./config/env");
const app = (0, express_1.default)();
const PORT = 8080;
// Middleware
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'http://localhost:5173', 
        'http://127.0.0.1:5173',
        'http://localhost:5174', 
        'http://localhost:5175',
        'http://localhost:5177',
        'http://127.0.0.1:5177',
        'http://localhost:4173'
    ],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint with MongoDB test
app.get('/health', async (req, res) => {
    console.log('✅ Health check requested');
    let dbStatus = 'mock';
    let dbError = null;
    // Test MongoDB connection if URI is available
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/tik-in-de-buurt') {
        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 0) {
                // Not connected, try to connect
                await mongoose.connect(process.env.MONGODB_URI, {
                    dbName: process.env.MONGODB_DB_NAME || 'tik-in-de-buurt',
                    serverSelectionTimeoutMS: 3000,
                    connectTimeoutMS: 3000,
                });
                dbStatus = 'connected';
                console.log('🔗 MongoDB Atlas connected for health check');
            }
            else if (mongoose.connection.readyState === 1) {
                dbStatus = 'already-connected';
            }
        }
        catch (error) {
            dbStatus = 'failed';
            dbError = error.message;
            console.log('❌ MongoDB health check failed:', error.message);
        }
    }
    res.status(200).json({
        ok: true,
        db: dbStatus,
        dbError,
        status: 'OK',
        server: 'stable-backend',
        port: PORT,
        timestamp: new Date().toISOString(),
        environment: 'development'
    });
});
// Test API endpoints
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend API is working!',
        timestamp: new Date().toISOString(),
        envTest: {
            mongoUri: !!process.env.MONGODB_URI,
            mongoUriLength: process.env.MONGODB_URI?.length || 0,
            mongoAlt1: !!process.env.MONGODB_URI_ALT1,
            mongoAlt2: !!process.env.MONGODB_URI_ALT2,
            dbName: process.env.MONGODB_DB_NAME
        }
    });
});
// MongoDB connection test endpoint
app.get('/api/test-mongodb', async (req, res) => {
    const mongoose = require('mongoose');
    const results = [];
    // Test different connection options
    const connectionOptions = [
        { name: 'Primary URI', uri: process.env.MONGODB_URI },
        { name: 'Alternative URI 1', uri: process.env.MONGODB_URI_ALT1 },
        { name: 'Alternative URI 2', uri: process.env.MONGODB_URI_ALT2 }
    ].filter(option => option.uri);
    for (const option of connectionOptions) {
        try {
            console.log(`🧪 Testing ${option.name}...`);
            // Close existing connections
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
            }
            await mongoose.connect(option.uri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            });
            results.push({
                name: option.name,
                status: 'SUCCESS',
                database: mongoose.connection.name,
                host: mongoose.connection.host
            });
            console.log(`✅ ${option.name} - SUCCESS`);
            break; // Stop on first success
        }
        catch (error) {
            results.push({
                name: option.name,
                status: 'FAILED',
                error: error.message,
                code: error.code
            });
            console.log(`❌ ${option.name} - FAILED: ${error.message}`);
        }
    }
    res.json({
        success: results.some(r => r.status === 'SUCCESS'),
        results,
        timestamp: new Date().toISOString(),
        recommendations: [
            '1. Check if user "servicenorbs_db_user" has "readWriteAnyDatabase" role',
            '2. Verify user has access to "tik-in-de-buurt" database specifically',
            '3. Try creating a new database user with full permissions',
            '4. Check if IP whitelist includes current IP address',
            '5. Verify cluster is not paused or in maintenance mode'
        ]
    });
});
// Fallback to local mode with MongoDB simulation
app.get('/api/db-fallback', (req, res) => {
    console.log('🔄 Using database fallback mode');
    res.json({
        status: 'fallback',
        message: 'Using local data simulation instead of MongoDB Atlas',
        features: [
            'User authentication (mock)',
            'Data storage (in-memory)',
            'API endpoints (functional)',
            'Payment system (Stripe ready)'
        ],
        note: 'MongoDB Atlas connection issues - operating in fallback mode'
    });
});
// Mock auth endpoints
app.post('/api/auth/register', (req, res) => {
    console.log('📝 Mock registration request');
    res.json({
        success: true,
        message: 'Mock registration successful',
        user: { id: 1, email: req.body.email }
    });
});
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Mock login request');
    res.json({
        success: true,
        message: 'Mock login successful',
        token: 'mock-jwt-token-123',
        user: { id: 1, email: req.body.email }
    });
});
app.post('/api/auth/register/business', (req, res) => {
    console.log('🏢 Mock business registration request:', req.body);
    const { name, email, businessName } = req.body;
    // Basic validation
    if (!name || !email || !businessName) {
        res.status(400).json({
            success: false,
            error: 'Name, email and business name are required'
        });
        return;
    }
    res.json({
        success: true,
        message: 'Business registered successfully',
        token: 'mock-business-jwt-token-123',
        user: {
            id: Date.now(),
            name: name,
            email: email,
            businessId: Date.now() + 1
        },
        business: {
            id: Date.now() + 1,
            name: businessName,
            description: req.body.businessDescription || '',
            category: req.body.category || 'other',
            owner: name,
            email: email,
            phone: req.body.phone || '',
            website: req.body.website || '',
            address: {
                street: req.body.street || '',
                postalCode: req.body.postalCode || '',
                city: req.body.city || 'Den Haag'
            },
            isVerified: false,
            createdAt: new Date().toISOString()
        }
    });
});
// Import Stripe service
const stripeService_1 = require("./services/stripeService");
// Mock payment endpoints
app.post('/api/payments/create-intent', async (req, res) => {
    console.log('💳 Payment intent request:', req.body);
    try {
        // Try real Stripe first, fallback to mock
        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_test_key_here') {
            const paymentIntent = await stripeService_1.stripeService.createPaymentIntent({
                amount: req.body.amount || 1000,
                currency: req.body.currency || 'eur',
                businessId: req.body.businessId || 'mock_business',
                planId: req.body.planId || 'basic',
                customerEmail: req.body.customerEmail || 'test@example.com'
            });
            res.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount
            });
        }
        else {
            // Mock response
            console.log('🎭 Using mock Stripe response');
            res.json({
                success: true,
                clientSecret: 'mock_client_secret_123',
                amount: req.body.amount || 1000
            });
        }
    }
    catch (error) {
        console.error('❌ Payment intent error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment intent'
        });
    }
});
app.post('/api/demo-payments/process', (req, res) => {
    console.log('🎭 Demo payment processing');
    res.json({
        success: true,
        message: 'Demo payment processed successfully',
        paymentId: 'demo_payment_' + Date.now()
    });
});
// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.originalUrl
    });
});
// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('🎯 STABLE BACKEND URUCHOMIONY!');
    console.log(`📡 Server: http://127.0.0.1:${PORT}`);
    console.log(`🌐 CORS: http://localhost:3000`);
    console.log(`✅ Stable backend running on port ${PORT}`);
    console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
});
server.on('error', (err) => {
    console.error('🚨 Server startup error:', err);
    if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${PORT} is already in use`);
    }
});
// Graceful shutdown - only for explicit termination
let isShuttingDown = false;
const gracefulShutdown = (signal) => {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    console.log(`\n🔄 ${signal} received, graceful shutdown...`);
    server.close(() => {
        console.log('🔴 Server closed');
        process.exit(0);
    });
    // Force exit after 5 seconds
    setTimeout(() => {
        console.log('⚠️ Forced exit after 5s');
        process.exit(1);
    }, 5000);
};
// Only handle explicit termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// Keep server alive
console.log('� Server is ready to accept connections...');
