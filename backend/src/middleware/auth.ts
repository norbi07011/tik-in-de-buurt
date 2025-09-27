import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { TokenService, TokenPayload } from '../services/tokenService';
import { config } from '../config/env';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
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

    // Use TokenService for verification
    const decoded = TokenService.verifyAccessToken(token);
    
    // Fetch user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND' 
      });
      return;
    }

    // Check if user is active (add this field to user model later if needed)
    // if (user.isBlocked) {
    //   res.status(401).json({ 
    //     success: false, 
    //     error: 'Account has been blocked',
    //     code: 'ACCOUNT_BLOCKED' 
    //   });
    //   return;
    // }

    req.user = user;
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

    // Use TokenService for verification
    const decoded = TokenService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
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
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
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

    const decoded = TokenService.verifyRefreshToken(refreshToken);
    req.body.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN' 
    });
  }
};