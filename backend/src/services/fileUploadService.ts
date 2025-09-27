import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  destination: string;
}

export interface ProcessedFile {
  originalname: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
  thumbnailUrl?: string;
}

export interface ImageVariant {
  name: string;
  width: number;
  height: number;
  quality: number;
}

class FileUploadService {
  private uploadsDir: string;

  // Standardowe rozmiary dla różnych typów zawartości
  private readonly IMAGE_VARIANTS: { [key: string]: ImageVariant[] } = {
    avatar: [
      { name: 'thumbnail', width: 150, height: 150, quality: 80 },
      { name: 'medium', width: 300, height: 300, quality: 85 },
      { name: 'large', width: 600, height: 600, quality: 90 }
    ],
    cover: [
      { name: 'thumbnail', width: 400, height: 200, quality: 80 },
      { name: 'medium', width: 800, height: 400, quality: 85 },
      { name: 'large', width: 1200, height: 600, quality: 90 }
    ],
    post: [
      { name: 'thumbnail', width: 300, height: 300, quality: 75 },
      { name: 'medium', width: 600, height: 600, quality: 85 },
      { name: 'large', width: 1080, height: 1080, quality: 90 }
    ]
  };

  // Konfiguracje upload dla różnych typów plików
  private readonly UPLOAD_CONFIGS: { [key: string]: UploadConfig } = {
    avatar: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      destination: 'avatars'
    },
    cover: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      destination: 'covers'
    },
    video: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
      destination: 'videos'
    },
    document: {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      destination: 'documents'
    }
  };

  constructor() {
    this.uploadsDir = path.resolve(config.UPLOAD_DIR);
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      // Utwórz główny katalog uploads
      await fs.mkdir(this.uploadsDir, { recursive: true });

      // Utwórz podkatalogi dla różnych typów plików
      for (const uploadConfig of Object.values(this.UPLOAD_CONFIGS)) {
        const dir = path.join(this.uploadsDir, uploadConfig.destination);
        await fs.mkdir(dir, { recursive: true });
        
        // Utwórz podkatalogi dla wariantów obrazów
        if (uploadConfig.allowedMimeTypes.some(mime => mime.startsWith('image/'))) {
          for (const variantName of Object.keys(this.IMAGE_VARIANTS)) {
            for (const variant of this.IMAGE_VARIANTS[variantName]) {
              const variantDir = path.join(dir, variant.name);
              await fs.mkdir(variantDir, { recursive: true });
            }
          }
        }
      }

      logger.info(`📁 Upload directories initialized: ${this.uploadsDir}`);
    } catch (error) {
      logger.error('Failed to initialize upload directories:', error);
    }
  }

  /**
   * Tworzy multer middleware dla określonego typu pliku
   */
  createUploadMiddleware(fileType: string) {
    const uploadConfig = this.UPLOAD_CONFIGS[fileType];
    if (!uploadConfig) {
      throw new Error(`Unknown file type: ${fileType}`);
    }

    const storage = multer.diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb) => {
        const destDir = path.join(this.uploadsDir, uploadConfig.destination);
        cb(null, destDir);
      },
      filename: (req: Request, file: Express.Multer.File, cb) => {
        const uniqueName = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed: ${uploadConfig.allowedMimeTypes.join(', ')}`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: uploadConfig.maxFileSize
      }
    });
  }

  /**
   * Przetwarza przesłany plik obrazu (tworzy warianty)
   */
  async processUploadedImage(file: Express.Multer.File, imageType: string): Promise<ProcessedFile> {
    try {
      const variants = this.IMAGE_VARIANTS[imageType];
      if (!variants) {
        throw new Error(`Unknown image type: ${imageType}`);
      }

      const baseUrl = `${config.FRONTEND_URL}/uploads`;
      const originalPath = file.path;
      const destDir = path.dirname(originalPath);
      const baseName = path.parse(file.filename).name;

      const processedFile: ProcessedFile = {
        originalname: file.originalname,
        filename: file.filename,
        path: originalPath,
        size: file.size,
        mimetype: file.mimetype,
        url: `${baseUrl}/${path.relative(this.uploadsDir, originalPath).replace(/\\/g, '/')}`
      };

      // Utwórz warianty obrazu
      for (const variant of variants) {
        const variantDir = path.join(destDir, variant.name);
        const variantFilename = `${baseName}.webp`; // Zawsze konwertuj do WebP
        const variantPath = path.join(variantDir, variantFilename);

        await sharp(originalPath)
          .resize(variant.width, variant.height, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: variant.quality })
          .toFile(variantPath);

        // Dodaj URL miniatury jako główny thumbnail
        if (variant.name === 'thumbnail') {
          processedFile.thumbnailUrl = `${baseUrl}/${path.relative(this.uploadsDir, variantPath).replace(/\\/g, '/')}`;
        }

        logger.info(`📸 Created ${variant.name} variant: ${variantFilename}`);
      }

      logger.info(`✅ Image processed successfully: ${file.originalname}`);
      return processedFile;

    } catch (error) {
      logger.error('Error processing uploaded image:', error);
      throw error;
    }
  }

  /**
   * Przetwarza przesłany plik wideo (tworzy miniaturę)
   */
  async processUploadedVideo(file: Express.Multer.File): Promise<ProcessedFile> {
    try {
      const baseUrl = `${config.FRONTEND_URL}/uploads`;
      const originalPath = file.path;

      const processedFile: ProcessedFile = {
        originalname: file.originalname,
        filename: file.filename,
        path: originalPath,
        size: file.size,
        mimetype: file.mimetype,
        url: `${baseUrl}/${path.relative(this.uploadsDir, originalPath).replace(/\\/g, '/')}`
      };

      // TODO: Dodaj generowanie miniatury wideo używając ffmpeg
      // Na razie zwracamy podstawowe informacje
      
      logger.info(`✅ Video processed successfully: ${file.originalname}`);
      return processedFile;

    } catch (error) {
      logger.error('Error processing uploaded video:', error);
      throw error;
    }
  }

  /**
   * Usuwa plik i wszystkie jego warianty
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadsDir, filePath);
      
      // Usuń główny plik
      await fs.unlink(fullPath);
      
      // Usuń warianty (jeśli istnieją)
      const dir = path.dirname(fullPath);
      const baseName = path.parse(path.basename(fullPath)).name;
      
      for (const variants of Object.values(this.IMAGE_VARIANTS)) {
        for (const variant of variants) {
          try {
            const variantPath = path.join(dir, variant.name, `${baseName}.webp`);
            await fs.unlink(variantPath);
          } catch (error) {
            // Ignoruj błędy - plik może nie istnieć
          }
        }
      }

      logger.info(`🗑️ File deleted: ${filePath}`);
      return true;

    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Generuje unikalną nazwę pliku
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).substring(0, 20); // Ogranicz długość
    
    return `${timestamp}-${random}-${baseName}${ext}`;
  }

  /**
   * Waliduje typ pliku i rozmiar
   */
  validateFile(file: Express.Multer.File, fileType: string): { valid: boolean; error?: string } {
    const config = this.UPLOAD_CONFIGS[fileType];
    if (!config) {
      return { valid: false, error: `Unknown file type: ${fileType}` };
    }

    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed: ${config.allowedMimeTypes.join(', ')}` 
      };
    }

    if (file.size > config.maxFileSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${config.maxFileSize / (1024 * 1024)}MB` 
      };
    }

    return { valid: true };
  }

  /**
   * Pobiera informacje o pliku
   */
  async getFileInfo(filePath: string): Promise<any> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadsDir, filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      return { exists: false, error: error };
    }
  }

  /**
   * Czyści stare pliki (starsze niż określony czas)
   */
  async cleanupOldFiles(maxAgeHours: number = 24): Promise<number> {
    let cleanedCount = 0;
    const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    try {
      const processDirectory = async (dirPath: string): Promise<void> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else {
            try {
              const stats = await fs.stat(fullPath);
              if (stats.birthtime.getTime() < maxAge) {
                await fs.unlink(fullPath);
                cleanedCount++;
                logger.info(`🧹 Cleaned old file: ${entry.name}`);
              }
            } catch (error) {
              // Ignoruj błędy dostępu do plików
            }
          }
        }
      };

      await processDirectory(this.uploadsDir);
      
      if (cleanedCount > 0) {
        logger.info(`🧹 Cleanup completed: ${cleanedCount} files removed`);
      }

    } catch (error) {
      logger.error('Error during file cleanup:', error);
    }

    return cleanedCount;
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;