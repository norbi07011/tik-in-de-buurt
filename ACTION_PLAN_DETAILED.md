# 🛠️ PLAN NAPRAWCZY I ROZWOJOWY - TIK IN DE BUURT
## Szczegółowy Action Plan

Data: 2 października 2025

---

## 📋 SPIS TREŚCI

1. [Quick Wins - Natychmiastowe poprawki](#quick-wins)
2. [Tydzień 1-2: Krytyczne funkcje](#tydzien-1-2)
3. [Tydzień 3-4: Ważne uzupełnienia](#tydzien-3-4)
4. [Tydzień 5-8: Funkcje rozwojowe](#tydzien-5-8)
5. [Długoterminowy development](#dlugoterminowy)

---

## 🔥 QUICK WINS (1-3 dni)

### Day 1: Security & Performance

#### 1. Rate Limiting (2 godziny)
```bash
# Install
cd backend
npm install express-rate-limit

# Create middleware
# backend/src/middleware/rateLimiter.ts
```

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  message: 'Too many login attempts, please try again later.'
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded, please try again later.'
});
```

**Apply in server.ts:**
```typescript
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter';

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/upload/', uploadLimiter);
```

✅ **Done: 2h**

---

#### 2. Helmet Security Headers (1 godzina)
```bash
npm install helmet
```

```typescript
// server.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

✅ **Done: 1h**

---

#### 3. File Upload Validation (2 godziny)
```typescript
// backend/src/middleware/fileValidation.ts

import { Request } from 'express';
import multer from 'multer';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'));
  }
};

export const videoFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, and MOV allowed.'));
  }
};

export const imageSizeLimit = MAX_IMAGE_SIZE;
export const videoSizeLimit = MAX_VIDEO_SIZE;
```

**Update upload routes:**
```typescript
// routes/upload.ts
import { imageFilter, videoFilter, imageSizeLimit, videoSizeLimit } from '../middleware/fileValidation';

const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: imageSizeLimit }
});

const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: videoSizeLimit }
});
```

✅ **Done: 2h**

---

### Day 2: Email Service Real Implementation

#### 4. Setup Email Service (8 godzin)

**Install dependencies:**
```bash
npm install nodemailer
npm install @types/nodemailer --save-dev
```

**Update backend/.env:**
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@tikindeuurt.nl
```

**Update emailService.ts:**
```typescript
// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';
import { config } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;
    
    await this.transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Verify Your Email - Tik in de Buurt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Tik in de Buurt!</h1>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
          </a>
          <p style="color: #666; font-size: 14px;">
            Or copy this link: <br>
            ${verificationUrl}
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-password/${token}`;
    
    await this.transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Password Reset - Tik in de Buurt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>You requested to reset your password. Click the button below:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.<br>
            Link: ${resetUrl}
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Welcome to Tik in de Buurt! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome, ${name}!</h1>
          <p>Thank you for joining Tik in de Buurt - your local business platform.</p>
          <h2>Get Started:</h2>
          <ul>
            <li>Complete your profile</li>
            <li>Discover local businesses</li>
            <li>Connect with your neighborhood</li>
          </ul>
          <a href="${config.frontendUrl}/discover" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Explore Now
          </a>
        </div>
      `,
    });
  }

  async sendBusinessWelcomeEmail(email: string, businessName: string): Promise<void> {
    await this.transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: `${businessName} - Welcome to Tik in de Buurt! 🏢`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome, ${businessName}!</h1>
          <p>Your business account has been created successfully.</p>
          <h2>Next Steps:</h2>
          <ol>
            <li>Complete your business profile</li>
            <li>Add photos and videos</li>
            <li>Choose a subscription plan</li>
            <li>Start promoting your business</li>
          </ol>
          <a href="${config.frontendUrl}/dashboard" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Go to Dashboard
          </a>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
```

✅ **Done: 8h** (Day 2 complete)

---

### Day 3: Email Verification Implementation

#### 5. Email Verification Endpoints (6 godzin)

**Update authController.ts:**
```typescript
// backend/src/controllers/authController.ts

import crypto from 'crypto';
import { emailService } from '../services/emailService';

export class AuthController {
  
  /**
   * Send email verification
   */
  static async sendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
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
          error: 'Email already verified'
        });
        return;
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = verificationToken;
      user.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send email
      await emailService.sendVerificationEmail(user.email, verificationToken);

      res.json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error: any) {
      logger.error('Send verification failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      // Find user with valid token
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
        return;
      }

      // Verify user
      user.isVerified = true;
      user.emailVerifiedAt = new Date();
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await user.save();

      logger.info(`Email verified: ${user.email}`);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error: any) {
      logger.error('Email verification failed:', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed'
      });
    }
  }

  /**
   * Send password reset email
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists
        res.json({
          success: true,
          message: 'If that email is registered, a reset link has been sent'
        });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = resetToken;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Send email
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.json({
        success: true,
        message: 'If that email is registered, a reset link has been sent'
      });
    } catch (error: any) {
      logger.error('Forgot password failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request'
      });
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
        return;
      }

      // Find user with valid token
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() }
      }).select('+password');

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
        return;
      }

      // Update password
      user.password = password; // Will be hashed by pre-save hook
      user.passwordResetAt = new Date();
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await user.save();

      logger.info(`Password reset: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error: any) {
      logger.error('Password reset failed:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset failed'
      });
    }
  }
}
```

**Update routes/auth.ts:**
```typescript
// Add new routes
router.post('/send-verification', AuthController.sendVerification);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password/:token', AuthController.resetPassword);
```

**Frontend - Create VerifyEmailPage.tsx:**
```typescript
// pages/VerifyEmailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${api.BASE_URL}/auth/verify-email/${token}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => navigate('/auth'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying your email...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Update ResetPasswordPage.tsx to use API:**
```typescript
// pages/ResetPasswordPage.tsx - Update handleSubmit

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (newPassword !== confirmPassword) {
    setError(t('passwords_do_not_match') || 'Passwords do not match');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const response = await fetch(`${api.BASE_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });

    const data = await response.json();

    if (data.success) {
      setSuccess(true);
      setTimeout(() => navigate('/auth'), 3000);
    } else {
      setError(data.error || 'Password reset failed');
    }
  } catch (error) {
    setError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

✅ **Done: 6h** (Day 3 complete)

---

## 📅 TYDZIEŃ 1-2: KRYTYCZNE FUNKCJE

### Sprint 1.1: Review System (3 dni)

#### Day 4-5: Model & Backend

**1. Create Review Model:**
```typescript
// backend/src/models/Review.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  photos?: string[];
  helpful: mongoose.Types.ObjectId[];
  notHelpful: mongoose.Types.ObjectId[];
  ownerResponse?: {
    text: string;
    respondedAt: Date;
  };
  verifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  photos: [{
    type: String
  }],
  helpful: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  notHelpful: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  ownerResponse: {
    text: String,
    respondedAt: Date
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now
  }
}, {
  timestamps: true
});

// Compound index: one review per user per business
reviewSchema.index({ userId: 1, businessId: 1 }, { unique: true });

// Index for filtering
reviewSchema.index({ businessId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

export default mongoose.model<IReview>('Review', reviewSchema);
```

**2. Create Review Routes:**
```typescript
// backend/src/routes/reviews.ts

import express from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/business/:businessId', ReviewController.getBusinessReviews);
router.get('/:id', ReviewController.getReview);

// Protected routes
router.post('/', authenticateToken, ReviewController.createReview);
router.put('/:id', authenticateToken, ReviewController.updateReview);
router.delete('/:id', authenticateToken, ReviewController.deleteReview);
router.post('/:id/helpful', authenticateToken, ReviewController.markHelpful);
router.post('/:id/respond', authenticateToken, ReviewController.addOwnerResponse);

export default router;
```

**3. Create Review Controller:**
```typescript
// backend/src/controllers/reviewController.ts

import { Request, Response } from 'express';
import Review from '../models/Review';
import Business from '../models/Business';
import { logger } from '../utils/logger';

export class ReviewController {
  
  /**
   * Get reviews for a business
   */
  static async getBusinessReviews(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const { page = 1, limit = 10, rating, sort = '-createdAt' } = req.query;

      const query: any = {
        businessId,
        status: 'approved'
      };

      if (rating) {
        query.rating = parseInt(rating as string);
      }

      const reviews = await Review.find(query)
        .populate('userId', 'name avatar')
        .sort(sort as string)
        .limit(parseInt(limit as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string));

      const total = await Review.countDocuments(query);

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });
    } catch (error: any) {
      logger.error('Get business reviews failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reviews'
      });
    }
  }

  /**
   * Create new review
   */
  static async createReview(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { businessId, rating, title, comment, photos } = req.body;

      // Validate
      if (!businessId || !rating || !title || !comment) {
        res.status(400).json({
          success: false,
          error: 'Business ID, rating, title, and comment are required'
        });
        return;
      }

      // Check if user already reviewed this business
      const existingReview = await Review.findOne({
        userId: req.user.id,
        businessId
      });

      if (existingReview) {
        res.status(400).json({
          success: false,
          error: 'You have already reviewed this business'
        });
        return;
      }

      // Create review
      const review = await Review.create({
        userId: req.user.id,
        businessId,
        rating,
        title,
        comment,
        photos: photos || []
      });

      // Update business rating
      await updateBusinessRating(businessId);

      // Populate user info
      await review.populate('userId', 'name avatar');

      logger.info(`Review created: ${review._id} for business ${businessId}`);

      res.status(201).json({
        success: true,
        data: { review }
      });
    } catch (error: any) {
      logger.error('Create review failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create review'
      });
    }
  }

  /**
   * Update review
   */
  static async updateReview(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const { rating, title, comment, photos } = req.body;

      const review = await Review.findById(id);

      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      // Check ownership
      if (review.userId.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this review'
        });
        return;
      }

      // Update
      if (rating !== undefined) review.rating = rating;
      if (title) review.title = title;
      if (comment) review.comment = comment;
      if (photos) review.photos = photos;

      await review.save();

      // Update business rating if rating changed
      if (rating !== undefined) {
        await updateBusinessRating(review.businessId.toString());
      }

      res.json({
        success: true,
        data: { review }
      });
    } catch (error: any) {
      logger.error('Update review failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update review'
      });
    }
  }

  /**
   * Delete review
   */
  static async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const review = await Review.findById(id);

      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      // Check ownership or admin
      if (review.userId.toString() !== req.user.id && req.user.userType !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this review'
        });
        return;
      }

      const businessId = review.businessId.toString();
      await review.deleteOne();

      // Update business rating
      await updateBusinessRating(businessId);

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete review failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete review'
      });
    }
  }

  /**
   * Mark review as helpful/not helpful
   */
  static async markHelpful(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const { helpful } = req.body; // true or false

      const review = await Review.findById(id);

      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      const userId = req.user.id;

      if (helpful) {
        // Add to helpful, remove from notHelpful
        if (!review.helpful.includes(userId as any)) {
          review.helpful.push(userId as any);
        }
        review.notHelpful = review.notHelpful.filter(id => id.toString() !== userId);
      } else {
        // Add to notHelpful, remove from helpful
        if (!review.notHelpful.includes(userId as any)) {
          review.notHelpful.push(userId as any);
        }
        review.helpful = review.helpful.filter(id => id.toString() !== userId);
      }

      await review.save();

      res.json({
        success: true,
        data: {
          helpfulCount: review.helpful.length,
          notHelpfulCount: review.notHelpful.length
        }
      });
    } catch (error: any) {
      logger.error('Mark helpful failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark review'
      });
    }
  }

  /**
   * Add owner response to review
   */
  static async addOwnerResponse(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const { text } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: 'Response text is required'
        });
        return;
      }

      const review = await Review.findById(id);

      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      // Check if user owns the business
      const business = await Business.findById(review.businessId);
      if (!business || business.ownerId.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Only business owner can respond to reviews'
        });
        return;
      }

      review.ownerResponse = {
        text,
        respondedAt: new Date()
      };

      await review.save();

      res.json({
        success: true,
        data: { review }
      });
    } catch (error: any) {
      logger.error('Add owner response failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add response'
      });
    }
  }
}

/**
 * Helper: Update business rating
 */
async function updateBusinessRating(businessId: string): Promise<void> {
  const reviews = await Review.find({ businessId, status: 'approved' });
  
  if (reviews.length === 0) {
    await Business.findByIdAndUpdate(businessId, {
      rating: 0,
      reviewCount: 0
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = totalRating / reviews.length;

  await Business.findByIdAndUpdate(businessId, {
    rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    reviewCount: reviews.length
  });
}
```

**4. Add to server.ts:**
```typescript
import reviewRoutes from './routes/reviews';
app.use('/api/reviews', reviewRoutes);
```

**5. Migrate existing reviews (if any):**
```typescript
// backend/scripts/migrateReviews.ts

import mongoose from 'mongoose';
import Business from '../src/models/Business';
import Review from '../src/models/Review';
import { config } from '../src/config/env';

async function migrateReviews() {
  await mongoose.connect(config.mongodbUri);

  const businesses = await Business.find({ 'reviews.0': { $exists: true } });

  console.log(`Found ${businesses.length} businesses with reviews to migrate`);

  for (const business of businesses) {
    if (business.reviews && business.reviews.length > 0) {
      for (const oldReview of business.reviews as any[]) {
        try {
          await Review.create({
            userId: oldReview.userId || oldReview.authorId,
            businessId: business._id,
            rating: oldReview.rating || 5,
            title: oldReview.title || 'Review',
            comment: oldReview.comment || oldReview.text,
            createdAt: oldReview.createdAt || new Date(),
            status: 'approved'
          });
          console.log(`Migrated review for business ${business.name}`);
        } catch (error) {
          console.error(`Failed to migrate review:`, error);
        }
      }
    }
  }

  console.log('Migration complete!');
  await mongoose.disconnect();
}

migrateReviews();
```

✅ **Done: 2 days (16h)**

#### Day 6: Frontend Integration

**Update BusinessReviews.tsx:**
```typescript
// components/BusinessReviews.tsx

import { useState, useEffect } from 'react';
import { api } from '../api';

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  comment: string;
  photos?: string[];
  helpful: string[];
  notHelpful: string[];
  ownerResponse?: {
    text: string;
    respondedAt: string;
  };
  createdAt: string;
}

export default function BusinessReviews({ businessId }: { businessId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, [businessId, page, filterRating]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (filterRating) params.append('rating', filterRating.toString());

      const response = await fetch(
        `${api.BASE_URL}/reviews/business/${businessId}?${params}`,
        {
          headers: api.getAuthHeaders()
        }
      );
      const data = await response.json();

      if (data.success) {
        setReviews(data.data.reviews);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... form handling
    
    try {
      const response = await fetch(`${api.BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          ...api.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId,
          rating: newRating,
          title: newTitle,
          comment: newComment
        })
      });

      const data = await response.json();

      if (data.success) {
        setReviews([data.data.review, ...reviews]);
        // Reset form
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const handleMarkHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      const response = await fetch(`${api.BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          ...api.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helpful })
      });

      const data = await response.json();

      if (data.success) {
        loadReviews(); // Refresh
      }
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  // ... render JSX
}
```

✅ **Done: 1 day (8h)**

---

### Sprint 1.2: Security Hardening (2 dni)

Already completed in Quick Wins!

---

### Sprint 1.3: Property Model (3 dni)

[Continue with Property model implementation following same pattern as Review...]

---

**TOTAL TYDZIEŃ 1-2:**  
- Quick Wins: 3 dni  
- Review System: 3 dni  
- Security: Done  
- Property Model: 3 dni  
- Testing & fixes: 1 dzień  

= **10 dni roboczych (2 tygodnie)**

---

## 📈 PROGRESS TRACKING

### Metrics:
- [ ] Rate limiting enabled
- [ ] Email service working
- [ ] Email verification working
- [ ] Password reset working
- [ ] Review model created
- [ ] Review API endpoints working
- [ ] Frontend review integration
- [ ] Property model created
- [ ] Property API endpoints
- [ ] Frontend property pages

### Daily Standup Questions:
1. What did I complete yesterday?
2. What will I work on today?
3. Any blockers?

---

**NASTĘPNY PLIK:** Będę kontynuował z Week 3-4 i Week 5-8 w osobnym dokumencie aby nie przekroczyć limitów.

