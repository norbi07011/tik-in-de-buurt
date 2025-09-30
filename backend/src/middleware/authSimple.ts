import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import AuthService from '../services/authService';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser & {
        userId: string;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required',
        code: 'TOKEN_MISSING' 
      });
      return;
    }

    // Use AuthService for verification
    const decoded = AuthService.verifyToken(token);
    
    // Fetch user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND' 
      });
      return;
    }

    // Set user with additional properties for compatibility
    req.user = {
      ...user.toObject(),
      userId: user._id.toString(),
      username: user.name || user.email,
      email: user.email,
      role: user.userType || 'user'
    } as any;
    next();
  } catch (error: any) {
    if (error.message === 'Invalid or expired access token') {
      res.status(401).json({ 
        success: false, 
        error: 'Token expired or invalid',
        code: 'TOKEN_EXPIRED' 
      });
      return;
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed',
      code: 'AUTH_ERROR' 
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    // Use AuthService for verification
    const decoded = AuthService.verifyToken(token);
    const user = await User.findById(decoded.id);
    
    if (user) {
      req.user = {
        ...user.toObject(),
        userId: user._id.toString(),
        username: user.name || user.email,
        email: user.email,
        role: user.userType || 'user'
      } as any;
    }
    
    next();
  } catch (error) {
    // For optional auth, we just continue without user
    next();
  }
};

// Generate JWT tokens (deprecated - use TokenService instead)
export const generateToken = (userId: string): string => {
  console.warn('⚠️  generateToken is deprecated, use TokenService.generateTokens instead');
  
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: '7d' } as jwt.SignOptions
  );
};

// New middleware for refresh token validation
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(401).json({ 
        success: false, 
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING' 
      });
      return;
    }

    const decoded = AuthService.verifyToken(refreshToken);
    req.body.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN' 
    });
  }
};

// Simple additional middleware for Maps & Geolocation
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.userId} with role ${req.user.role}`);
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const rateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    
    const userRequests = requests.get(identifier as string);
    
    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize counter
      requests.set(identifier as string, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (userRequests.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier}`);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
      return;
    }
    
    userRequests.count++;
    next();
  };
};