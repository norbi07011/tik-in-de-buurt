import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Business from '../models/Business';
import { generateToken, authenticateToken, validateRefreshToken } from '../middleware/auth';
import { validate, ValidatedRequest } from '../middleware/validate';
import { TokenService } from '../services/tokenService';
import { AuthController } from '../controllers/authController';
import AuthService from '../services/authService';
import { emailService } from '../services/emailService';
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

    // Use AuthService for dual-mode registration
    const result = await AuthService.registerUser({ name, email, password });

    // Send verification email (mock in development)
    try {
      await emailService.sendVerificationEmail(email, {
        username: name,
        verificationCode: '123456', // Mock code for development
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?code=123456&email=${encodeURIComponent(email)}`
      });
      console.log(`📧 Verification email sent to: ${email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        isVerified: (result.user as any).isVerified || false
      },
      token: result.token
    });
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ error: errorMessage });
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
      phone,
      website,
      street,
      postalCode,
      city,
      kvkNumber,
      btwNumber,
      iban,
      instagram,
      facebook,
      twitter,
      linkedin,
      tiktokUrl,
      spokenLanguages,
      paymentMethods,
      googleMapsUrl
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !businessName) {
      res.status(400).json({ 
        error: 'Name, email, password and business name are required' 
      });
      return;
    }
    
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
    
    if (businessName.trim().length < 2) {
      res.status(400).json({ error: 'Business name must be at least 2 characters' });
      return;
    }

    // Use AuthService for business registration
    const result = await AuthService.registerBusiness({
      name,
      email,
      password,
      businessName,
      businessDescription,
      category: category || 'other',
      phone,
      website,
      street,
      postalCode,
      city,
      kvkNumber,
      btwNumber,
      iban,
      instagram,
      facebook,
      twitter,
      linkedin,
      tiktokUrl,
      spokenLanguages,
      paymentMethods,
      googleMapsUrl
    });

    // Send welcome email for business (mock in development)
    try {
      await emailService.sendWelcomeEmail(email, {
        username: name,
        loginLink: `${process.env.FRONTEND_URL}/login`
      });
      console.log(`📧 Welcome email sent to business: ${email}`);
    } catch (emailError) {
      console.error('Business email sending failed:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'Business registered successfully',
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        userType: result.user.userType,
        businessId: result.user.businessId
      },
      business: {
        id: result.business._id,
        name: result.business.name,
        description: result.business.description,
        category: result.business.category,
        email: result.business.email
      },
      token: result.token
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

    // Use AuthService for dual-mode login
    const result = await AuthService.login({ email, password });

    res.json({
      message: 'Login successful',
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        businessId: (result.user as any).businessId,
        freelancerId: (result.user as any).freelancerId,
        isVerified: (result.user as any).isVerified || false
      },
      token: result.token,
      ...(result.business && { business: result.business })
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: errorMessage === 'Invalid credentials' ? errorMessage : 'Login failed' });
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

// ===== NEW AUTH ENDPOINTS USING AUTHCONTROLLER =====

/**
 * @route POST /api/auth/register/business-v2
 * @desc Register new business user (NEW VERSION)
 * @access Public
 */
router.post('/register/business-v2', async (req, res) => {
  await AuthController.registerBusiness(req, res);
});

/**
 * @route POST /api/auth/register/user-v2  
 * @desc Register new regular user (NEW VERSION)
 * @access Public
 */
router.post('/register/user-v2', async (req, res) => {
  await AuthController.registerUser(req, res);
});

/**
 * @route POST /api/auth/login-v2
 * @desc User login (NEW VERSION)
 * @access Public
 */
router.post('/login-v2', async (req, res) => {
  await AuthController.login(req, res);
});

/**
 * @route GET /api/auth/profile-v2
 * @desc Get current user profile (NEW VERSION)
 * @access Private
 */
router.get('/profile-v2', authenticateToken, async (req, res) => {
  await AuthController.getProfile(req, res);
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetToken +resetTokenExpires');
    
    if (!user) {
      // For security, don't reveal if email exists
      res.status(200).json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
    
    // Generate 6-digit reset code for email
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, {
        username: user.name,
        resetLink,
        resetCode: resetToken.substring(0, 6).toUpperCase() // Use first 6 chars of token as display code
      });

      res.status(200).json({ 
        message: 'Password reset instructions have been sent to your email address.' 
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      res.status(500).json({ 
        error: 'Failed to send reset email. Please try again later.' 
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Reset token is required' });
      return;
    }

    if (!validatePassword(newPassword)) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    }).select('+password +resetToken +resetTokenExpires');

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    user.passwordResetAt = new Date();
    await user.save();

    res.status(200).json({ 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/auth/verify-reset-token
 * @desc Verify if reset token is valid
 * @access Public
 */
router.get('/verify-reset-token/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    res.status(200).json({ 
      message: 'Reset token is valid',
      email: user.email // Optionally return email for UI display
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;