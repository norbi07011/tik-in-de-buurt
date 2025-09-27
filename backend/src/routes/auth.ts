import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Business from '../models/Business';
import { generateToken, authenticateToken, validateRefreshToken } from '../middleware/auth';
import { validate, ValidatedRequest } from '../middleware/validate';
import { TokenService } from '../services/tokenService';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  emailVerificationSchema,
  businessRegisterSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  EmailVerificationInput,
  BusinessRegisterInput
} from '../schemas/authSchemas';

const router = express.Router();

// Simple validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return !!(password && password.length >= 6);
};

const validateName = (name: string): boolean => {
  return !!(name && name.trim().length >= 2 && name.trim().length <= 50);
};

// Register user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!validateName(name)) {
      res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
      return;
    }
    
    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email' });
      return;
    }
    
    if (!validatePassword(password)) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists with this email' });
      return;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Register business
router.post('/register/business', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      email, 
      password,
      businessName,
      businessDescription,
      category,
      address,
      phone,
      website,
      services = []
    } = req.body;
    
    // Validate input
    if (!validateName(name)) {
      res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
      return;
    }
    
    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email' });
      return;
    }
    
    if (!validatePassword(password)) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    
    if (!businessName || businessName.trim().length < 2) {
      res.status(400).json({ error: 'Business name is required' });
      return;
    }

    // Use mock mode if database is not available
    const isMongoReady = mongoose.connection.readyState === 1;
    console.log('🔍 Database Status:', { 
      mockMode: req.mockMode, 
      databaseAvailable: req.databaseAvailable,
      mongooseState: mongoose.connection.readyState,
      isMongoReady 
    });
    
    if (req.mockMode || !isMongoReady) {
      const mockUsers = req.getMockUsers();
      
      // Check if user already exists in mock data
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser) {
        res.status(400).json({ error: 'User already exists with this email' });
        return;
      }

      // Create mock user and business
      const newUserId = String(Date.now());
      const newBusinessId = `business_${Date.now()}`;
      
      const mockUser = {
        id: newUserId,
        _id: newUserId,
        name,
        email,
        password: 'hashed_password_mock',
        isVerified: false,
        avatar: null,
        businessId: newBusinessId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockBusiness = {
        id: newBusinessId,
        _id: newBusinessId,
        ownerId: newUserId,
        name: businessName,
        description: businessDescription,
        category,
        address,
        phone,
        email,
        website,
        services: services || [],
        rating: 0,
        reviewCount: 0,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const token = generateToken(newUserId);

      res.status(201).json({
        message: 'Business registered successfully (mock mode)',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          businessId: mockUser.businessId
        },
        business: mockBusiness,
        token
      });
      return;
    }

    // Database mode - original logic
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists with this email' });
      return;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Create business profile
    const business = new Business({
      ownerId: user._id,
      name: businessName,
      description: businessDescription,
      category,
      address,
      phone,
      email,
      website,
      services
    });

    await business.save();

    // Link business to user
    user.businessId = business._id as any;
    await user.save();

    const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

    res.status(201).json({
      message: 'Business registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessId: business._id
      },
      business: {
        id: business._id,
        name: business.name,
        category: business.category
      },
      token
    });
  } catch (error) {
    console.error('Business registration error:', error);
    res.status(500).json({ error: 'Business registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email' });
      return;
    }
    
    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
        freelancerId: user.freelancerId,
        isVerified: user.isVerified
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
        freelancerId: user.freelancerId,
        isVerified: user.isVerified,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Enhanced register with validation
router.post('/register-enhanced', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, userType, phone } = (req as ValidatedRequest<RegisterInput>).validatedData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
      return;
    }

    // Create new user
    const user = new User({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      password,
      userType,
      phone,
      isVerified: false, // Require email verification
      isActive: true
    });

    await user.save();

    // Generate tokens
    const tokens = TokenService.generateTokens({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      userType: user.userType
    });

    // Generate email verification token (implement email sending later)
    const verificationToken = TokenService.generateEmailVerificationToken(user.email);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified
        },
        ...tokens,
        verificationToken // In production, this would be sent via email
      }
    });
  } catch (error) {
    console.error('Enhanced register error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed' 
    });
  }
});

// Enhanced login with validation
router.post('/login-enhanced', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = (req as ValidatedRequest<LoginInput>).validatedData;
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(401).json({ 
        success: false,
        error: 'Account has been deactivated' 
      });
      return;
    }

    // Generate tokens
    const tokens = TokenService.generateTokens({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      userType: user.userType
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
          avatar: user.avatar
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Enhanced login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed' 
    });
  }
});

// Refresh token endpoint
router.post('/refresh', validate(refreshTokenSchema), validateRefreshToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      res.status(401).json({ 
        success: false,
        error: 'User not found or inactive' 
      });
      return;
    }

    // Generate new tokens
    const tokens = TokenService.generateTokens({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      userType: user.userType
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Token refresh failed' 
    });
  }
});

// Email verification endpoint
router.post('/verify-email', validate(emailVerificationSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = (req as ValidatedRequest<EmailVerificationInput>).validatedData;
    
    // Verify email token
    const { email } = TokenService.verifyEmailVerificationToken(token);
    
    // Find and update user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ 
        success: false,
        error: 'Email is already verified' 
      });
      return;
    }

    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Invalid or expired verification token') {
      res.status(400).json({ 
        success: false,
        error: 'Invalid or expired verification token' 
      });
      return;
    }
    
    console.error('Email verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Email verification failed' 
    });
  }
});

// Enhanced logout with token cleanup
router.post('/logout-enhanced', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // In the future, we can implement token blacklisting here
    // For now, we rely on client-side token removal
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed' 
    });
  }
});

// Logout (client-side token removal, but we can add token blacklisting later)
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logout successful' });
});

export default router;