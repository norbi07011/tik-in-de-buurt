import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  userType?: 'user' | 'business';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  
  static generateTokens(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign(
      payload, 
      config.JWT_SECRET, 
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      { userId: payload.userId }, 
      config.JWT_REFRESH_SECRET || config.JWT_SECRET, 
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }
  
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }
  
  static verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, config.JWT_REFRESH_SECRET || config.JWT_SECRET) as { userId: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
  
  static generateEmailVerificationToken(email: string): string {
    return jwt.sign(
      { email, purpose: 'email-verification' },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  static verifyEmailVerificationToken(token: string): { email: string } {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as any;
      if (payload.purpose !== 'email-verification') {
        throw new Error('Invalid token purpose');
      }
      return { email: payload.email };
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }
}