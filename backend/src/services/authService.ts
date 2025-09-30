import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import Business, { IBusiness } from '../models/Business';
import { logger } from '../utils/logger';
import { JsonStorageService } from './jsonStorageService';
import { JsonUser, JsonBusiness } from '../types/jsonModels';
import mongoConnection, { connectMongo, getDb } from '../db/mongo';
import { ObjectId } from 'mongodb';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface BusinessRegistrationData {
  // Personal info
  name: string;
  email: string;
  password: string;
  
  // Business info
  businessName: string;
  businessDescription?: string;
  category: string;
  companyMotto?: string;
  establishedYear?: number;
  teamSize?: string;
  spokenLanguages?: string;
  paymentMethods?: string;
  certifications?: string;
  sustainabilityInfo?: string;
  
  // Legal info
  kvkNumber?: string;
  btwNumber?: string;
  iban?: string;
  
  // Address
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  otherLocations?: string[];
  
  // Social media
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  tiktokUrl?: string;
  otherLinkUrl?: string;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'freelancer';
}

class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7 days';
  private static readonly SALT_ROUNDS = 12;

  /**
   * Check if we're in mock mode (no MongoDB connection)
   */
  private static isMockMode(): boolean {
    return process.env.MOCK_MODE === 'true';
  }

  /**
   * Generates JWT token for user
   */
  static generateToken(userId: string, email: string, role: string, businessId?: string, freelancerId?: string): string {
    const payload = {
      id: userId,
      email,
      role,
      ...(businessId && { businessId }),
      ...(freelancerId && { freelancerId })
    };

    const options: jwt.SignOptions = {
      expiresIn: '7d',
      issuer: 'tik-in-de-buurt',
      audience: 'tik-in-de-buurt-users'
    };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  /**
   * Verifies JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'tik-in-de-buurt',
        audience: 'tik-in-de-buurt-users'
      });
    } catch (error) {
      logger.error('JWT verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Hashes password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compares password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Registers new business user
   */
  static async registerBusiness(data: BusinessRegistrationData): Promise<{ user: IUser | JsonUser; business: IBusiness | JsonBusiness; token: string }> {
    try {
      // Validate required fields
      if (!data.name || !data.email || !data.password || !data.businessName) {
        throw new Error('Name, email, password and business name are required');
      }

      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      if (this.isMockMode()) {
        // JSON Storage mode
        await JsonStorageService.init();

        // Check if email already exists
        const existingUser = await JsonStorageService.findOne<JsonUser>('users', { 
          email: data.email.toLowerCase() 
        });
        if (existingUser) {
          throw new Error('Email address is already registered');
        }

        // Create business first
        const businessData: Omit<JsonBusiness, '_id' | 'createdAt' | 'updatedAt'> = {
          name: data.businessName,
          description: data.businessDescription || '',
          category: data.category || 'other',
          ownerId: '', // Will be updated after user creation
          
          // Contact info
          phone: data.phone || '',
          website: data.website || '',
          email: data.email,
          googleMapsUrl: data.googleMapsUrl || '',
          
          // Address  
          address: {
            street: data.street || '',
            postalCode: data.postalCode || '',
            city: data.city || 'Den Haag',
            country: 'Netherlands'
          },
          
          // Legal info
          kvkNumber: data.kvkNumber || '',
          btwNumber: data.btwNumber || '',
          iban: data.iban || '',
          
          // Arrays
          spokenLanguages: data.spokenLanguages ? [data.spokenLanguages] : [],
          paymentMethods: data.paymentMethods ? [data.paymentMethods] : [],
          
          // Social media
          socialMedia: {
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            twitter: data.twitter || '',
            linkedin: data.linkedin || '',
            tiktok: data.tiktokUrl || ''
          },
          
          // System fields
          isVerified: false,
          rating: 4.0,
          reviewCount: 0,
          logoUrl: '',
          coverImageUrl: '',
          services: [],
          subscriptionStatus: 'inactive'
        };

        const business = await JsonStorageService.insert<JsonBusiness>('businesses', businessData);
        logger.info(`Business created (JSON): ${business.name}`);

        // Create user
        const userData: Omit<JsonUser, '_id' | 'createdAt' | 'updatedAt'> = {
          name: data.name,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          businessId: business._id,
          userType: 'business',
          isVerified: false,
          isActive: true
        };

        const user = await JsonStorageService.insert<JsonUser>('users', userData);
        logger.info(`Business user created (JSON): ${user.email}`);

        // Update business with owner reference
        await JsonStorageService.updateById<JsonBusiness>('businesses', business._id, {
          ownerId: user._id
        });

        // Generate token
        const token = this.generateToken(
          user._id,
          user.email,
          user.userType,
          business._id
        );

        return { user, business, token };
      } else {
        // MongoDB mode - używamy natywnego drivera MongoDB
        await connectMongo();
        const db = getDb();
        if (!db) throw new Error('Database connection failed');
        
        // Check if email already exists
        const existingUser = await db.collection('users').findOne({ 
          email: data.email.toLowerCase() 
        });
        if (existingUser) {
          throw new Error('Email address is already registered');
        }

        // Prepare business data
        const businessData = {
          name: data.businessName,
          description: data.businessDescription || '',
          category: data.category || 'other',
          ownerId: null, // Will be updated after user creation
          
          // Contact info
          phone: data.phone || '',
          website: data.website || '',
          email: data.email,
          googleMapsUrl: data.googleMapsUrl || '',
          
          // Address
          address: {
            street: data.street || '',
            postalCode: data.postalCode || '',
            city: data.city || 'Den Haag',
            country: 'Netherlands'
          },
          
          // Legal info
          kvkNumber: data.kvkNumber || '',
          btwNumber: data.btwNumber || '',
          iban: data.iban || '',
          
          // Arrays
          spokenLanguages: data.spokenLanguages ? [data.spokenLanguages] : [],
          paymentMethods: data.paymentMethods ? [data.paymentMethods] : [],
          
          // Social media
          socialMedia: {
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            twitter: data.twitter || '',
            linkedin: data.linkedin || '',
            tiktok: data.tiktokUrl || ''
          },
          
          // System fields
          isVerified: false,
          rating: 4.0,
          reviewCount: 0,
          logoUrl: '',
          coverImageUrl: '',
          services: [],
          subscriptionStatus: 'inactive',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Insert business into MongoDB
        const businessResult = await db.collection('businesses').insertOne(businessData);
        const businessId = businessResult.insertedId;
        logger.info(`Business created (MongoDB): ${businessData.name}`);

        // Prepare user data
        const userData = {
          name: data.name,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          businessId: businessId,
          userType: 'business',
          isVerified: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Insert user into MongoDB
        const userResult = await db.collection('users').insertOne(userData);
        const userId = userResult.insertedId;
        logger.info(`Business user created (MongoDB): ${userData.email}`);

        // Update business with owner reference
        await db.collection('businesses').updateOne(
          { _id: businessId },
          { $set: { ownerId: userId, updatedAt: new Date() } }
        );

        // Prepare return objects
        const user = { _id: userId, ...userData } as any;
        const business = { _id: businessId, ...businessData, ownerId: userId } as any;

        // Generate token
        const token = this.generateToken(
          userId.toString(),
          user.email,
          user.userType as 'business',
          businessId.toString()
        );

        return { user, business, token };
      }
    } catch (error) {
      logger.error('Business registration failed:', error);
      throw error;
    }
  }

  /**
   * Registers regular user
   */
  static async registerUser(data: UserRegistrationData): Promise<{ user: IUser | JsonUser; token: string }> {
    try {
      const normalizedEmail = data.email.toLowerCase();

      // Check if email already exists (dual storage support)
      if (this.isMockMode()) {
        const existingUser = await JsonStorageService.findOne('users', { email: normalizedEmail });
        if (existingUser) {
          throw new Error('Email address is already registered');
        }
      } else {
        const db = getDb();
        if (!db) throw new Error('Database connection failed');
        const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
        if (existingUser) {
          throw new Error('Email address is already registered');
        }
      }

      // Validate required fields
      if (!data.name || !data.email || !data.password) {
        throw new Error('Name, email and password are required');
      }

      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create user data
      const userToCreate = {
        name: data.name,
        email: normalizedEmail,
        password: hashedPassword,
        userType: 'user' as const,
        isVerified: false,
        isActive: true,
        createdAt: new Date(),
        lastLogin: undefined
      };

      // Save user (dual storage support)
      let savedUser: IUser | JsonUser;
      if (this.isMockMode()) {
        savedUser = await JsonStorageService.insert<JsonUser>('users', userToCreate);
        logger.info(`User registered (JSON): ${savedUser.email}`);
      } else {
        const db = getDb();
        if (!db) throw new Error('Database connection failed');
        const result = await db.collection('users').insertOne(userToCreate);
        savedUser = { _id: result.insertedId, ...userToCreate } as any;
        logger.info(`User registered (MongoDB): ${savedUser.email}`);
      }

      // Generate token
      const userId = this.isMockMode() ? (savedUser as JsonUser)._id : (savedUser._id as any).toString();
      const token = this.generateToken(
        userId,
        savedUser.email,
        savedUser.userType
      );

      return { user: savedUser, token };
    } catch (error) {
      logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticates user login
   */
  static async login(credentials: LoginCredentials): Promise<{ user: IUser | JsonUser; business?: IBusiness | JsonBusiness; token: string }> {
    try {
      const normalizedEmail = credentials.email.toLowerCase();
      let user: IUser | JsonUser | null = null;
      let business: IBusiness | JsonBusiness | null = null;

      // Find user by email (dual storage support)
      if (process.env.MOCK_MODE === 'true') {
        user = await JsonStorageService.findOne<JsonUser>('users', { email: normalizedEmail });
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Get business if user is business owner
        if ((user as JsonUser).businessId) {
          business = await JsonStorageService.findOne<JsonBusiness>('businesses', { _id: (user as JsonUser).businessId });
        }
      } else {
        await connectMongo();
        const db = getDb();
        if (!db) throw new Error('Database connection failed');
        user = await db.collection('users').findOne({ email: normalizedEmail }) as any;
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Get business if user is business owner
        if ((user as any).businessId) {
          business = await db.collection('businesses').findOne({ _id: (user as any).businessId }) as any;
        }
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      logger.info(`User logged in: ${user.email}`);

      // Generate token
      const userId = process.env.MOCK_MODE === 'true' ? (user as JsonUser)._id : (user._id as any).toString();
      const businessId = business ? 
        (process.env.MOCK_MODE === 'true' ? (business as JsonBusiness)._id : (business._id as any).toString()) : 
        undefined;

      const token = this.generateToken(
        userId,
        user.email,
        user.userType,
        businessId
      );

      return { user, business: business || undefined, token };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Gets user by ID (for token validation)
   */
  static async getUserById(userId: string): Promise<IUser | JsonUser | null> {
    try {
      if (this.isMockMode()) {
        return await JsonStorageService.findOne<JsonUser>('users', { _id: userId });
      } else {
        await connectMongo();
        const db = getDb();
        if (!db) throw new Error('Database connection failed');
        return await db.collection('users').findOne({ _id: new ObjectId(userId) }) as any;
      }
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      return null;
    }
  }

  /**
   * Updates user's last login
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      if (process.env.MOCK_MODE === 'true') {
        await JsonStorageService.updateById('users', userId, { updatedAt: new Date() });
      } else {
        await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
      }
    } catch (error) {
      logger.error('Update last login failed:', error);
    }
  }
}

export default AuthService;