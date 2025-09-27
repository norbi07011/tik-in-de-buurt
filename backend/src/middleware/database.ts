import { Request, Response, NextFunction } from 'express';
import { databaseManager } from '../config/database';

// Mock data for fallback when database is not available
export const mockUsers = [
  {
    id: '1',
    _id: '1',
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    password: '$2a$10$dummy.hash.for.testing.purposes.only',
    isVerified: true,
    avatar: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    _id: '2',
    name: 'Anna Nowak',
    email: 'anna@example.com',
    password: '$2a$10$dummy.hash.for.testing.purposes.only',
    isVerified: true,
    avatar: null,
    businessId: 'business_1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  }
];

export const mockBusinesses = [
  {
    id: 'business_1',
    _id: 'business_1',
    name: 'Kawiarnia Pod Lipą',
    description: 'Przytulna kawiarnia w centrum miasta',
    category: 'Gastronomia',
    address: 'ul. Główna 123, Warszawa',
    city: 'Warszawa',
    phone: '+48 123 456 789',
    email: 'kontakt@podlipa.pl',
    website: 'https://kawiarniapodlipa.pl',
    verified: true,
    images: ['https://example.com/images/kawiarnia1.jpg'],
    rating: 4.5,
    reviewCount: 42,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  }
];

export const mockVideos = [
  {
    id: 'video_1',
    _id: 'video_1',
    title: 'Nowości w kawiarni',
    description: 'Sprawdź nasze nowe menu!',
    url: 'https://example.com/video1.mp4',
    thumbnail: 'https://example.com/thumb1.jpg',
    authorId: '2',
    businessId: 'business_1',
    likes: 15,
    views: 128,
    tags: ['kawiarnia', 'menu', 'nowości'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

/**
 * Middleware to check database availability and provide mock data fallback
 */
export const databaseFallback = (req: Request, res: Response, next: NextFunction) => {
  const dbStatus = databaseManager.getStatus();
  
  // Add database status to request for routes to use
  req.databaseAvailable = dbStatus.isConnected;
  req.mockMode = !dbStatus.isConnected;
  
  // Add helper functions for mock data access
  req.getMockUsers = () => mockUsers;
  req.getMockBusinesses = () => mockBusinesses;
  req.getMockVideos = () => mockVideos;
  
  next();
};

// Extend Request interface to include database status
declare global {
  namespace Express {
    interface Request {
      databaseAvailable: boolean;
      mockMode: boolean;
      getMockUsers: () => typeof mockUsers;
      getMockBusinesses: () => typeof mockBusinesses;
      getMockVideos: () => typeof mockVideos;
    }
  }
}