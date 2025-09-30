import { Request, Response } from 'express';
import AuthService, { BusinessRegistrationData, UserRegistrationData, LoginCredentials } from '../services/authService';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';
import { NotificationType } from '../models/Notification';

/**
 * Auth Controller - handles authentication and registration
 */
export class AuthController {

  /**
   * Register new business user
   */
  static async registerBusiness(req: Request, res: Response): Promise<void> {
    try {
      const registrationData: BusinessRegistrationData = req.body;

      // Validate required fields
      if (!registrationData.name || !registrationData.email || !registrationData.password || !registrationData.businessName) {
        res.status(400).json({
          success: false,
          error: 'Name, email, password and business name are required'
        });
        return;
      }

      // Register business
      const result = await AuthService.registerBusiness(registrationData);

      logger.info(`Business registered successfully: ${result.business.name} (${result.user.email})`);

      // Send welcome notification
      try {
        await NotificationService.create({
          recipientId: (result.user._id as any).toString(),
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Welcome to Tik in de Buurt!',
          message: `Welcome ${result.user.name}! Your business "${result.business.name}" has been registered successfully.`,
          sendEmail: true
        });
      } catch (notificationError) {
        logger.error('Failed to send welcome notification:', notificationError);
        // Don't fail the registration if notification fails
      }

      res.status(201).json({
        success: true,
        message: 'Business registered successfully',
        data: {
          token: result.token,
          user: {
            id: result.user._id,
            name: result.user.name,
            email: result.user.email,
            userType: result.user.userType,
            businessId: result.user.businessId,
            isVerified: result.user.isVerified
          },
          business: {
            id: result.business._id,
            name: result.business.name,
            description: result.business.description,
            category: result.business.category,
            address: result.business.address,
            subscriptionStatus: result.business.subscriptionStatus
          }
        }
      });
    } catch (error: any) {
      logger.error('Business registration failed:', error);
      
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  }

  /**
   * Register regular user
   */
  static async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const registrationData: UserRegistrationData = req.body;

      // Validate required fields
      if (!registrationData.name || !registrationData.email || !registrationData.password) {
        res.status(400).json({
          success: false,
          error: 'Name, email and password are required'
        });
        return;
      }

      // Register user
      const result = await AuthService.registerUser(registrationData);

      logger.info(`User registered successfully: ${result.user.email}`);

      // Send welcome notification
      try {
        await NotificationService.create({
          recipientId: (result.user._id as any).toString(),
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Welcome to Tik in de Buurt!',
          message: `Welcome ${result.user.name}! Your account has been created successfully.`,
          sendEmail: true
        });
      } catch (notificationError) {
        logger.error('Failed to send welcome notification:', notificationError);
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token: result.token,
          user: {
            id: result.user._id,
            name: result.user.name,
            email: result.user.email,
            userType: result.user.userType,
            isVerified: result.user.isVerified
          }
        }
      });
    } catch (error: any) {
      logger.error('User registration failed:', error);
      
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  }

  /**
   * User login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginCredentials = req.body;

      // Validate required fields
      if (!credentials.email || !credentials.password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      // Authenticate user
      const result = await AuthService.login(credentials);

      logger.info(`User logged in successfully: ${result.user.email}`);

      // Prepare response data
      const responseData: any = {
        token: result.token,
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          userType: result.user.userType,
          isVerified: result.user.isVerified,
          businessId: result.user.businessId,
          freelancerId: result.user.freelancerId
        }
      };

      // Add business data if user is business owner
      if (result.business) {
        responseData.business = {
          id: result.business._id,
          name: result.business.name,
          description: result.business.description,
          category: result.business.category,
          address: result.business.address,
          subscriptionStatus: result.business.subscriptionStatus,
          rating: result.business.rating,
          reviewCount: result.business.reviewCount,
          isVerified: result.business.isVerified
        };
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: responseData
      });
    } catch (error: any) {
      logger.error('Login failed:', error);
      
      res.status(401).json({
        success: false,
        error: error.message || 'Invalid credentials'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            isVerified: user.isVerified,
            businessId: user.businessId,
            freelancerId: user.freelancerId,
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (error: any) {
      logger.error('Get profile failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile'
      });
    }
  }

  /**
   * Logout user (mainly for clearing server-side sessions if needed)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In JWT-based auth, logout is mainly handled client-side
      // But we can log the event and potentially blacklist the token
      
      if (req.user) {
        logger.info(`User logged out: ${req.user.email}`);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      logger.error('Logout failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  /**
   * Verify email (placeholder for future implementation)
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      // TODO: Implement email verification logic
      // For now, just return success
      
      res.json({
        success: true,
        message: 'Email verification feature coming soon'
      });
    } catch (error: any) {
      logger.error('Email verification failed:', error);
      
      res.status(400).json({
        success: false,
        error: 'Email verification failed'
      });
    }
  }

  /**
   * Request password reset (placeholder for future implementation)
   */
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      // TODO: Implement password reset logic
      // For now, just return success
      
      res.json({
        success: true,
        message: 'Password reset feature coming soon'
      });
    } catch (error: any) {
      logger.error('Password reset request failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Password reset request failed'
      });
    }
  }
}