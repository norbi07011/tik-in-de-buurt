import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Simple JSON-based storage service for development/mock mode
 * Stores data in JSON files instead of MongoDB
 */
export class JsonStorageService {
  private static dataDir = path.join(process.cwd(), 'data');

  /**
   * Initialize storage directory
   */
  static async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      logger.info('📁 JSON Storage initialized:', this.dataDir);
    } catch (error) {
      logger.error('Failed to initialize JSON storage:', error);
      throw error;
    }
  }

  /**
   * Read data from JSON file
   */
  static async read<T>(collection: string): Promise<T[]> {
    try {
      const filePath = path.join(this.dataDir, `${collection}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        return [];
      }
      logger.error(`Failed to read ${collection}.json:`, error);
      throw error;
    }
  }

  /**
   * Write data to JSON file
   */
  static async write<T>(collection: string, data: T[]): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, `${collection}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error(`Failed to write ${collection}.json:`, error);
      throw error;
    }
  }

  /**
   * Add new document to collection
   */
  static async insert<T extends { _id?: string; createdAt?: Date; updatedAt?: Date }>(
    collection: string, 
    document: Omit<T, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    const data = await this.read<T>(collection);
    
    const newDoc: T = {
      ...document,
      _id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as T;

    data.push(newDoc);
    await this.write(collection, data);
    
    logger.info(`Document inserted into ${collection}:`, newDoc._id);
    return newDoc;
  }

  /**
   * Find documents by query
   */
  static async find<T>(collection: string, query: Partial<T> = {}): Promise<T[]> {
    const data = await this.read<T>(collection);
    
    if (Object.keys(query).length === 0) {
      return data;
    }

    return data.filter(doc => {
      return Object.entries(query).every(([key, value]) => {
        return (doc as any)[key] === value;
      });
    });
  }

  /**
   * Find one document by query
   */
  static async findOne<T>(collection: string, query: Partial<T>): Promise<T | null> {
    const results = await this.find<T>(collection, query);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update document by ID
   */
  static async updateById<T extends { _id: string; updatedAt?: Date }>(
    collection: string, 
    id: string, 
    updates: Partial<T>
  ): Promise<T | null> {
    const data = await this.read<T>(collection);
    const index = data.findIndex(doc => doc._id === id);
    
    if (index === -1) {
      return null;
    }

    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date()
    } as T;

    await this.write(collection, data);
    logger.info(`Document updated in ${collection}:`, id);
    return data[index];
  }

  /**
   * Delete document by ID
   */
  static async deleteById<T extends { _id: string }>(collection: string, id: string): Promise<boolean> {
    const data = await this.read<T>(collection);
    const initialLength = data.length;
    const filtered = data.filter(doc => doc._id !== id);
    
    if (filtered.length < initialLength) {
      await this.write(collection, filtered);
      logger.info(`Document deleted from ${collection}:`, id);
      return true;
    }
    
    return false;
  }

  /**
   * Generate simple ID (for development use only)
   */
  private static generateId(): string {
    return Math.random().toString(36).substr(2, 17);
  }

  /**
   * Check if document exists
   */
  static async exists<T>(collection: string, query: Partial<T>): Promise<boolean> {
    const doc = await this.findOne<T>(collection, query);
    return doc !== null;
  }

  /**
   * Count documents
   */
  static async count<T>(collection: string, query: Partial<T> = {}): Promise<number> {
    const results = await this.find<T>(collection, query);
    return results.length;
  }
}