import mongoose from 'mongoose';
import User from '../models/User';
import Business from '../models/Business';
import Video from '../models/Video';

export class IndexManager {
  
  static async createOptimizedIndexes(): Promise<void> {
    console.log('📊 Creating optimized database indexes...');
    
    try {
      await Promise.all([
        this.createUserIndexes(),
        this.createBusinessIndexes(),
        this.createVideoIndexes()
      ]);
      
      console.log('✅ All indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      throw error;
    }
  }

  private static async createUserIndexes(): Promise<void> {
    console.log('👥 Creating User indexes...');
    
    const userIndexes = [
      // Profile queries
      { isActive: 1, isVerified: 1 },
      { userType: 1, isActive: 1 },
      
      // Search functionality
      { 
        firstName: 'text', 
        lastName: 'text', 
        name: 'text' 
      },
      
      // Business relationship
      { businessId: 1 },
      { freelancerId: 1 },
      
      // Timestamps dla sorting
      { createdAt: -1 },
      { lastLogin: -1 }
    ];

    for (const index of userIndexes) {
      try {
        await User.collection.createIndex(index as any);
        console.log(`  ✓ User index created:`, Object.keys(index).join(', '));
      } catch (error: any) {
        if (error.code !== 85) { // Index już istnieje
          console.warn(`  ⚠️  User index warning:`, error.message);
        }
      }
    }
  }

  private static async createBusinessIndexes(): Promise<void> {
    console.log('🏢 Creating Business indexes...');
    
    const businessIndexes = [
      // Core business lookups
      { ownerId: 1 },
      { isActive: 1, verified: 1 },
      
      // Category and location filtering
      { category: 1, city: 1 },
      { category: 1, isActive: 1 },
      { city: 1, isActive: 1 },
      { country: 1, city: 1 },
      
      // Search functionality
      { 
        name: 'text', 
        description: 'text',
        category: 'text',
        subcategory: 'text'
      },
      
      // Performance metrics
      { rating: -1, reviewCount: -1 },
      { reviewCount: -1 },
      
      // Email and contact
      { email: 1 },
      { phone: 1 },
      
      // Timestamps
      { createdAt: -1 },
      { updatedAt: -1 }
    ];

    for (const index of businessIndexes) {
      try {
        await Business.collection.createIndex(index as any);
        console.log(`  ✓ Business index created:`, Object.keys(index).join(', '));
      } catch (error: any) {
        if (error.code !== 85) {
          console.warn(`  ⚠️  Business index warning:`, error.message);
        }
      }
    }
  }

  private static async createVideoIndexes(): Promise<void> {
    console.log('🎥 Creating Video indexes...');
    
    const videoIndexes = [
      // Author and business relationships
      { authorId: 1 },
      { businessId: 1 },
      
      // Content status
      { isActive: 1, createdAt: -1 },
      
      // Category filtering
      { category: 1, isActive: 1 },
      { tags: 1 },
      
      // Search functionality
      { 
        title: 'text', 
        description: 'text',
        tags: 'text'
      },
      
      // Performance metrics (dla sorting)
      { views: -1 },
      { likesCount: -1 },
      { views: -1, createdAt: -1 },
      { likesCount: -1, createdAt: -1 },
      
      // Video properties
      { duration: 1 },
      
      // Timestamps
      { createdAt: -1 },
      { updatedAt: -1 },
      
      // Compound indexes dla popular queries
      { isActive: 1, category: 1, createdAt: -1 },
      { authorId: 1, isActive: 1, createdAt: -1 },
      { businessId: 1, isActive: 1, createdAt: -1 }
    ];

    for (const index of videoIndexes) {
      try {
        await Video.collection.createIndex(index as any);
        console.log(`  ✓ Video index created:`, Object.keys(index).join(', '));
      } catch (error: any) {
        if (error.code !== 85) {
          console.warn(`  ⚠️  Video index warning:`, error.message);
        }
      }
    }
  }

  static async dropAllIndexes(): Promise<void> {
    console.log('🗑️  Dropping all custom indexes...');
    
    try {
      await Promise.all([
        User.collection.dropIndexes(),
        Business.collection.dropIndexes(), 
        Video.collection.dropIndexes()
      ]);
      
      console.log('✅ All indexes dropped');
    } catch (error) {
      console.error('❌ Failed to drop indexes:', error);
      throw error;
    }
  }

  static async getIndexStats(): Promise<void> {
    console.log('📊 Database Index Statistics:');
    
    try {
      const collections = [
        { name: 'User', model: User },
        { name: 'Business', model: Business },
        { name: 'Video', model: Video }
      ];

      for (const { name, model } of collections) {
        const indexes = await model.collection.listIndexes().toArray();
        console.log(`\n${name} Collection:`);
        
        for (const index of indexes) {
          console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to get index stats:', error);
    }
  }
}