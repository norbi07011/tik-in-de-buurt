import mongoose from 'mongoose';
import { config } from '../src/config/env';
import { databaseManager } from '../src/config/database';
import User from '../src/models/User';
import Business from '../src/models/Business';
// Import Video model if exists
// import Video from '../src/models/Video';

/**
 * Minimal seed script for tik-in-de-buurt
 * Creates sample User, Business, and Video documents if collections are empty
 */
async function seedDatabase() {
  try {
    console.log('[Seed] Starting database seeding...');
    
    // Connect to database
    const connected = await databaseManager.connect();
    if (!connected) {
      console.log('[Seed] Database not available - skipping seed');
      return;
    }

    // Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const sampleUser = new User({
        name: 'Sample User',
        email: 'user@example.com',
        password: '$2a$10$example.hashed.password', // bcrypt hashed "password123"
        isVerified: true,
        userType: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await sampleUser.save();
      console.log('[Seed] Created sample user');
    } else {
      console.log('[Seed] Users collection not empty, skipping');
    }

    // Seed Businesses
    const businessCount = await Business.countDocuments();
    if (businessCount === 0) {
      const sampleBusiness = new Business({
        name: 'Sample Restaurant',
        description: 'A delicious local restaurant serving traditional Dutch cuisine',
        category: 'restaurant',
        address: {
          street: 'Damrak 1',
          city: 'Amsterdam', 
          zipCode: '1012 LG',
          country: 'Netherlands'
        },
        phone: '+31 20 123 4567',
        email: 'info@samplerestaurant.nl',
        website: 'https://samplerestaurant.nl',
        coordinates: {
          lat: 52.3676,
          lng: 4.9041
        },
        rating: 4.5,
        reviewCount: 23,
        verified: true,
        priceRange: 2,
        hours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '22:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '12:00', close: '21:00' }
        },
        amenities: ['wifi', 'parking', 'outdoor_seating'],
        services: ['dine_in', 'takeaway', 'delivery'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await sampleBusiness.save();
      console.log('[Seed] Created sample business');
    } else {
      console.log('[Seed] Businesses collection not empty, skipping');
    }

    // Note: Video seeding commented out - add when Video model is available
    /*
    const videoCount = await Video.countDocuments();
    if (videoCount === 0) {
      const sampleVideo = new Video({
        title: 'Welcome to Amsterdam!',
        description: 'A beautiful tour of our city',
        filename: 'sample-video.mp4',
        mimetype: 'video/mp4',
        size: 1024000,
        uploadedBy: sampleUser._id,
        businessId: sampleBusiness._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await sampleVideo.save();
      console.log('[Seed] Created sample video');
    } else {
      console.log('[Seed] Videos collection not empty, skipping');
    }
    */

    console.log('[Seed] Database seeding completed successfully');
    
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed] Database connection closed');
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };