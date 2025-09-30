import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend directory
const envPath = path.resolve(__dirname, '../../.env');
console.log('🔍 Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Environment validation
const requiredEnvVars = {
  PORT: parseInt(process.env.PORT || '8080'),
  BIND_HOST: process.env.BIND_HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/tik-in-de-buurt',
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'tik-in-de-buurt',
  MOCK_MODE: process.env.MOCK_MODE === 'true' ? true : false,
  DB_ENABLED: process.env.DB_ENABLED === 'false' ? false : true,
  DB_RETRY_ATTEMPTS: parseInt(process.env.DB_RETRY_ATTEMPTS || '5'),
  DB_RETRY_DELAY_MS: parseInt(process.env.DB_RETRY_DELAY_MS || '1500'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-me',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Database configuration and management
  DB_AUTO_SEED: process.env.DB_AUTO_SEED === 'true',
  DB_AUTO_INDEX: process.env.DB_AUTO_INDEX === 'true',
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  DB_SOCKET_TIMEOUT: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
  DB_MAX_POOL_SIZE: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
  
  // Database fallback and cloud options
  USE_MONGODB_ATLAS: process.env.USE_MONGODB_ATLAS === 'true',
  
  // MongoDB Atlas specific settings
  ATLAS_CLUSTER_NAME: process.env.ATLAS_CLUSTER_NAME || '',
  ATLAS_DB_USERNAME: process.env.ATLAS_DB_USERNAME || '',
  ATLAS_DB_PASSWORD: process.env.ATLAS_DB_PASSWORD || '',
  
  // Email configuration
  EMAIL_ENABLED: process.env.EMAIL_ENABLED === 'false' ? false : true,
  EMAIL_HOST: process.env.EMAIL_HOST || 'localhost',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Tik in de Buurt',
  EMAIL_FROM_EMAIL: process.env.EMAIL_FROM_EMAIL || 'noreply@tikindebuurt.com',
  
  // SMS/Twilio configuration
  SMS_ENABLED: process.env.SMS_ENABLED === 'false' ? false : true,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || ''
};

// Validate critical env vars in production
if (process.env.NODE_ENV === 'production') {
  if (requiredEnvVars.JWT_SECRET === 'development-secret-change-me') {
    console.error('⚠️  CRITICAL: JWT_SECRET must be changed in production!');
    process.exit(1);
  }
  if (requiredEnvVars.JWT_REFRESH_SECRET === 'development-refresh-secret-change-me') {
    console.error('⚠️  CRITICAL: JWT_REFRESH_SECRET must be changed in production!');
    process.exit(1);
  }
}

// Enhanced configuration with structured sections
export const config = {
  ...requiredEnvVars,
  env: requiredEnvVars.NODE_ENV,
  email: {
    enabled: requiredEnvVars.EMAIL_ENABLED,
    host: requiredEnvVars.EMAIL_HOST,
    port: requiredEnvVars.EMAIL_PORT,
    secure: requiredEnvVars.EMAIL_SECURE,
    auth: {
      user: requiredEnvVars.EMAIL_USER,
      pass: requiredEnvVars.EMAIL_PASS
    },
    fromName: requiredEnvVars.EMAIL_FROM_NAME,
    fromEmail: requiredEnvVars.EMAIL_FROM_EMAIL
  }
};

// Database connection helper
export const getDatabaseUrl = (): string => {
  if (config.USE_MONGODB_ATLAS && config.ATLAS_DB_USERNAME && config.ATLAS_DB_PASSWORD) {
    return `mongodb+srv://${config.ATLAS_DB_USERNAME}:${config.ATLAS_DB_PASSWORD}@${config.ATLAS_CLUSTER_NAME}.mongodb.net/tik-in-de-buurt?retryWrites=true&w=majority`;
  }
  return config.DATABASE_URL;
};

// Enhanced database config
export const getDatabaseConfig = () => ({
  url: getDatabaseUrl(),
  options: {
    serverSelectionTimeoutMS: config.DB_CONNECTION_TIMEOUT,
    socketTimeoutMS: config.DB_SOCKET_TIMEOUT,
    maxPoolSize: config.DB_MAX_POOL_SIZE,
    bufferCommands: false,
    retryWrites: true,
    // Connection pool management
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
    family: 4 // Use IPv4, skip trying IPv6
  }
});

// Log configuration (redact sensitive data)
console.log('📋 Environment Configuration:');
console.log(`   NODE_ENV: ${config.NODE_ENV}`);
console.log(`   PORT: ${config.PORT}`);
console.log(`   DB_ENABLED: ${config.DB_ENABLED}`);
console.log(`   FRONTEND_URL: ${config.FRONTEND_URL}`);
console.log(`   UPLOAD_DIR: ${config.UPLOAD_DIR}`);
console.log(`   JWT_SECRET: ${config.JWT_SECRET.substring(0, 4)}***`);