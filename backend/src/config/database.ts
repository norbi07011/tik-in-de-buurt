import mongoose from 'mongoose';
import { config, getDatabaseConfig } from './env';
import { DatabaseSeeder } from './seed';
import { IndexManager } from './indexManager';
import { localDataService } from '../services/localDataService';

export interface DatabaseStatus {
  isConnected: boolean;
  connectionState: string;
  host?: string;
  name?: string;
  error?: string;
  mode: 'mongodb' | 'local' | 'disabled';
  collections?: { [key: string]: number };
}

class DatabaseManager {
  private connectionAttempts = 0;
  private readonly maxRetries = config.DB_RETRY_ATTEMPTS || 5;

  async connect(): Promise<boolean> {
    if (!config.DB_ENABLED) {
      console.log('🔄 Database disabled - running in mock mode');
      return false;
    }

    // Try multiple connection options for MongoDB Atlas
    const connectionOptions = [
      { url: config.MONGODB_URI, name: 'Primary URI with database name' },
      { url: process.env.MONGODB_URI_ALT1, name: 'Alternative URI without database' },
      { url: process.env.MONGODB_URI_ALT2, name: 'Alternative URI with test database' }
    ].filter(option => option.url); // Remove undefined options

    for (const option of connectionOptions) {
      try {
        this.connectionAttempts++;
        console.log(`[DB] Attempting MongoDB connection (${this.connectionAttempts}/${this.maxRetries})...`);
        console.log(`   Strategy: ${option.name}`);
        console.log(`   URL: ${option.url!.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);

        await mongoose.connect(option.url!, {
          dbName: config.MONGODB_DB_NAME,
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 8000,
          socketTimeoutMS: 8000,
        });

        console.log('[DB] Connected successfully');
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        
        // Set up connection event listeners
        this.setupEventListeners();
        
        // Auto-initialize database features if enabled
        await this.initializeDatabaseFeatures();
        
        return true;
      } catch (error: any) {
        console.error(`[DB] Connection failed with ${option.name}:`, error.message);
        // Continue to next option
      }
    }

    // If all connection options failed
    console.error(`[DB] All connection attempts failed (${this.connectionAttempts}/${this.maxRetries})`);
    
    if (this.connectionAttempts < this.maxRetries) {
      const retryDelay = config.DB_RETRY_DELAY_MS || 1500;
      console.log(`⏳ Retrying all options in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return this.connect();
    } else {
      console.log('🔄 Max retries reached - falling back to local data mode');
      await this.initializeLocalMode();
      return false;
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on('error', (error) => {
      console.error('🔥 MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await mongoose.connection.close();
      console.log('📦 MongoDB connection closed');
      process.exit(0);
    });
  }

  getStatus(): DatabaseStatus {
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const isMongoConnected = connectionState === 1 && config.DB_ENABLED;
    
    return {
      isConnected: isMongoConnected || config.DB_ENABLED,
      connectionState: states[connectionState as keyof typeof states] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      error: connectionState === 0 && config.DB_ENABLED ? 'Database connection failed or disabled' : undefined,
      mode: isMongoConnected ? 'mongodb' : (config.DB_ENABLED ? 'local' : 'disabled'),
      collections: isMongoConnected ? undefined : localDataService.getStats()
    };
  }

  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('📦 MongoDB connection closed');
    }
  }

  private async initializeDatabaseFeatures(): Promise<void> {
    try {
      // Create optimized indexes if enabled
      if (config.DB_AUTO_INDEX) {
        console.log('🔧 Auto-indexing enabled, creating optimized indexes...');
        await IndexManager.createOptimizedIndexes();
      }

      // Seed database if enabled and empty
      if (config.DB_AUTO_SEED) {
        console.log('🌱 Auto-seeding enabled, checking if database needs seeding...');
        await DatabaseSeeder.seedAll();
      }
    } catch (error) {
      console.warn('⚠️  Database feature initialization failed:', error);
      // Don't throw - continue with basic connection
    }
  }

  // Manual database management methods
  async seed(force = false): Promise<void> {
    await DatabaseSeeder.seedAll({ 
      users: true, 
      businesses: true, 
      videos: true, 
      force 
    });
  }

  async createIndexes(): Promise<void> {
    await IndexManager.createOptimizedIndexes();
  }

  async getIndexStats(): Promise<void> {
    await IndexManager.getIndexStats();
  }

  private async initializeLocalMode(): Promise<void> {
    try {
      console.log('📁 Initializing local data mode...');
      await localDataService.initialize();
      
      // Seed local data if empty and auto-seed is enabled
      if (config.DB_AUTO_SEED) {
        const stats = localDataService.getStats();
        const isEmpty = Object.values(stats).every(count => count === 0);
        if (isEmpty) {
          console.log('🌱 Seeding local data...');
          await this.seedLocalData();
        }
      }
      
      console.log('✅ Local data mode initialized successfully');
      console.log('   Collections:', localDataService.getStats());
    } catch (error) {
      console.error('❌ Failed to initialize local data mode:', error);
    }
  }

  private async seedLocalData(): Promise<void> {
    // Create sample data for testing
    try {
      // Sample users
      await localDataService.create('users', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        isVerified: true
      });

      // Sample business
      await localDataService.create('businesses', {
        name: 'Sample Business',
        email: 'business@example.com',
        category: 'restaurant',
        city: 'Amsterdam',
        verified: true
      });

      console.log('🌱 Local data seeded successfully');
    } catch (error) {
      console.warn('⚠️  Failed to seed local data:', error);
    }
  }
}

export const databaseManager = new DatabaseManager();