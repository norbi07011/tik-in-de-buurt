import User from '../models/User';
import Business from '../models/Business';
import Video from '../models/Video';
import { databaseManager } from './database';

export interface SeedOptions {
  users?: boolean;
  businesses?: boolean;
  videos?: boolean;
  force?: boolean; // Clear existing data first
}

export class DatabaseSeeder {
  
  static async seedAll(options: SeedOptions = { users: true, businesses: true, videos: true }): Promise<void> {
    console.log('🌱 Starting database seeding...');
    
    const dbStatus = databaseManager.getStatus();
    if (!dbStatus.isConnected) {
      console.log('⚠️  Database not connected - skipping seed');
      return;
    }

    try {
      if (options.force) {
        await this.clearDatabase();
      }

      if (options.users) {
        await this.seedUsers();
      }

      if (options.businesses) {
        await this.seedBusinesses();
      }

      if (options.videos) {
        await this.seedVideos();
      }

      console.log('✅ Database seeding completed successfully');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private static async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Business.deleteMany({}),
      Video.deleteMany({})
    ]);
    console.log('✅ Database cleared');
  }

  private static async seedUsers(): Promise<void> {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`👥 Users already exist (${existingUsers}), skipping seed`);
      return;
    }

    console.log('👥 Seeding users...');
    
    const seedUsers = [
      {
        name: 'Jan Kowalski',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        password: 'Test123456', // Will be hashed by model
        userType: 'user',
        phone: '+48123456789',
        isVerified: true,
        isActive: true
      },
      {
        name: 'Anna Nowak',
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna@example.com',
        password: 'Test123456',
        userType: 'business',
        phone: '+48987654321',
        isVerified: true,
        isActive: true
      },
      {
        name: 'Piotr Wiśniewski',
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        email: 'piotr@example.com',
        password: 'Test123456',
        userType: 'user',
        isVerified: false,
        isActive: true
      }
    ];

    await User.insertMany(seedUsers);
    console.log(`✅ Seeded ${seedUsers.length} users`);
  }

  private static async seedBusinesses(): Promise<void> {
    const existingBusinesses = await Business.countDocuments();
    if (existingBusinesses > 0) {
      console.log(`🏢 Businesses already exist (${existingBusinesses}), skipping seed`);
      return;
    }

    console.log('🏢 Seeding businesses...');
    
    // Find business owner
    const businessOwner = await User.findOne({ email: 'anna@example.com' });
    if (!businessOwner) {
      console.log('⚠️  Business owner not found, skipping business seed');
      return;
    }

    const seedBusinesses = [
      {
        name: 'Kawiarnia Pod Lipą',
        description: 'Przytulna kawiarnia w centrum miasta z najlepszą kawą w okolicy',
        category: 'Gastronomia',
        subcategory: 'Kawiarnia',
        address: 'ul. Główna 123, 00-001 Warszawa',
        city: 'Warszawa',
        country: 'Poland',
        phone: '+48123456789',
        email: 'kontakt@podlipa.pl',
        website: 'https://kawiarniapodlipa.pl',
        ownerId: businessOwner._id,
        verified: true,
        isActive: true,
        rating: 4.5,
        reviewCount: 42,
        businessHours: {
          monday: '08:00-18:00',
          tuesday: '08:00-18:00',
          wednesday: '08:00-18:00',
          thursday: '08:00-18:00',
          friday: '08:00-20:00',
          saturday: '09:00-20:00',
          sunday: '10:00-16:00'
        }
      },
      {
        name: 'TechFix Naprawa Komputerów',
        description: 'Profesjonalna naprawa i serwis komputerów, laptopów i sprzętu IT',
        category: 'Technologie',
        subcategory: 'Serwis IT',
        address: 'ul. Informatyczna 45, 02-222 Warszawa',
        city: 'Warszawa', 
        country: 'Poland',
        phone: '+48987654321',
        email: 'serwis@techfix.pl',
        website: 'https://techfix.pl',
        ownerId: businessOwner._id,
        verified: false,
        isActive: true,
        rating: 4.8,
        reviewCount: 15
      }
    ];

    const createdBusinesses = await Business.insertMany(seedBusinesses);
    
    // Update user with business reference
    businessOwner.businessId = createdBusinesses[0]._id as any;
    await businessOwner.save();
    
    console.log(`✅ Seeded ${createdBusinesses.length} businesses`);
  }

  private static async seedVideos(): Promise<void> {
    const existingVideos = await Video.countDocuments();
    if (existingVideos > 0) {
      console.log(`🎥 Videos already exist (${existingVideos}), skipping seed`);
      return;
    }

    console.log('🎥 Seeding videos...');
    
    const users = await User.find().limit(3);
    const businesses = await Business.find().limit(2);
    
    if (users.length === 0) {
      console.log('⚠️  No users found, skipping video seed');
      return;
    }

    const seedVideos = [
      {
        title: 'Najlepsza kawa w Warszawie!',
        description: 'Sprawdź naszą nową mieszankę kawy z Brazylii',
        url: '/uploads/videos/coffee-demo.mp4',
        thumbnailUrl: '/uploads/thumbnails/coffee-demo.jpg',
        authorId: users[0]._id,
        businessId: businesses[0]?._id,
        duration: 45,
        category: 'Gastronomia',
        tags: ['kawa', 'warszawa', 'kawiarnia'],
        isActive: true,
        views: 1250,
        likes: [users[1]._id, users[2]._id],
        likesCount: 2
      },
      {
        title: 'Jak naprawić laptop w 5 minut',
        description: 'Proste triki na naprawę najpopularniejszych problemów z laptopem',
        url: '/uploads/videos/laptop-repair.mp4',
        thumbnailUrl: '/uploads/thumbnails/laptop-repair.jpg', 
        authorId: users[1]._id,
        businessId: businesses[1]?._id,
        duration: 300,
        category: 'Technologie',
        tags: ['laptop', 'naprawa', 'tutorial'],
        isActive: true,
        views: 856,
        likes: [users[0]._id],
        likesCount: 1
      }
    ];

    await Video.insertMany(seedVideos);
    console.log(`✅ Seeded ${seedVideos.length} videos`);
  }
}

// Export dla convenience
export const seedDatabase = DatabaseSeeder.seedAll;