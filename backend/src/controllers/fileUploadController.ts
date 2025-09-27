import { Request, Response, NextFunction } from 'express';
import { fileUploadService, ProcessedFile } from '../services/fileUploadService';
import User from '../models/User';
import { logger } from '../utils/logger';

export class FileUploadController {
  /**
   * Upload avatara użytkownika
   */
  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Nie wybrano pliku do przesłania'
        });
        return;
      }

      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID użytkownika jest wymagane'
        });
        return;
      }

      // Sprawdź czy użytkownik istnieje
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      // Waliduj plik
      const validation = fileUploadService.validateFile(req.file, 'avatar');
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error
        });
        return;
      }

      // Przetwórz obraz (utwórz warianty)
      const processedFile = await fileUploadService.processUploadedImage(req.file, 'avatar');

      // Usuń stary avatar (jeśli istnieje)
      if (user.avatar) {
        await fileUploadService.deleteFile(user.avatar);
      }

      // Zaktualizuj użytkownika
      user.avatar = processedFile.path;
      await user.save();

      logger.info(`👤 Avatar uploaded for user ${user.name}: ${processedFile.filename}`);

      res.status(200).json({
        success: true,
        message: 'Avatar został pomyślnie przesłany',
        file: processedFile,
        user: {
          id: user._id,
          name: user.name,
          avatar: processedFile.url,
          thumbnailUrl: processedFile.thumbnailUrl
        }
      });

    } catch (error) {
      logger.error('Error uploading avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas przesyłania avatara'
      });
    }
  }

  /**
   * Upload okładki profilu/biznesu
   */
  static async uploadCover(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Nie wybrano pliku do przesłania'
        });
        return;
      }

      const { userId, entityType = 'user' } = req.body; // user lub business
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID użytkownika/biznesu jest wymagane'
        });
        return;
      }

      // Waliduj plik
      const validation = fileUploadService.validateFile(req.file, 'cover');
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error
        });
        return;
      }

      // Przetwórz obraz
      const processedFile = await fileUploadService.processUploadedImage(req.file, 'cover');

      // Zaktualizuj odpowiednią encję
      // TODO: Dodaj obsługę Business model gdy będzie gotowy
      if (entityType === 'user') {
        const user = await User.findById(userId);
        if (!user) {
          res.status(404).json({
            success: false,
            message: 'Użytkownik nie został znaleziony'
          });
          return;
        }

        // Usuń starą okładkę
        if (user.coverImage) {
          await fileUploadService.deleteFile(user.coverImage);
        }

        user.coverImage = processedFile.path;
        await user.save();
      }

      logger.info(`🖼️ Cover uploaded for ${entityType} ${userId}: ${processedFile.filename}`);

      res.status(200).json({
        success: true,
        message: 'Okładka została pomyślnie przesłana',
        file: processedFile
      });

    } catch (error) {
      logger.error('Error uploading cover:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas przesyłania okładki'
      });
    }
  }

  /**
   * Upload wideo
   */
  static async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Nie wybrano pliku wideo do przesłania'
        });
        return;
      }

      const { userId, title, description } = req.body;
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID użytkownika jest wymagane'
        });
        return;
      }

      // Sprawdź czy użytkownik istnieje
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      // Waliduj plik
      const validation = fileUploadService.validateFile(req.file, 'video');
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error
        });
        return;
      }

      // Przetwórz wideo
      const processedFile = await fileUploadService.processUploadedVideo(req.file);

      // TODO: Zapisz informacje o wideo do bazy danych (Video model)
      
      logger.info(`🎥 Video uploaded by user ${user.name}: ${processedFile.filename}`);

      res.status(200).json({
        success: true,
        message: 'Wideo zostało pomyślnie przesłane',
        file: processedFile,
        video: {
          title: title || 'Bez tytułu',
          description: description || '',
          url: processedFile.url,
          thumbnailUrl: processedFile.thumbnailUrl,
          uploadedBy: user.name,
          uploadedAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error uploading video:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas przesyłania wideo'
      });
    }
  }

  /**
   * Upload dokumentu
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Nie wybrano dokumentu do przesłania'
        });
        return;
      }

      const { userId, documentType = 'general' } = req.body;
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID użytkownika jest wymagane'
        });
        return;
      }

      // Waliduj plik
      const validation = fileUploadService.validateFile(req.file, 'document');
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error
        });
        return;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
      const processedFile: ProcessedFile = {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `${baseUrl}/${req.file.filename}`
      };

      logger.info(`📄 Document uploaded by user ${userId}: ${processedFile.filename}`);

      res.status(200).json({
        success: true,
        message: 'Dokument został pomyślnie przesłany',
        file: processedFile,
        document: {
          type: documentType,
          name: req.file.originalname,
          size: req.file.size,
          url: processedFile.url,
          uploadedAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas przesyłania dokumentu'
      });
    }
  }

  /**
   * Usuwa plik
   */
  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { filePath, userId } = req.body;
      
      if (!filePath || !userId) {
        res.status(400).json({
          success: false,
          message: 'Ścieżka pliku i ID użytkownika są wymagane'
        });
        return;
      }

      // TODO: Sprawdź uprawnienia - czy użytkownik może usunąć ten plik

      const deleted = await fileUploadService.deleteFile(filePath);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Nie udało się usunąć pliku'
        });
        return;
      }

      logger.info(`🗑️ File deleted by user ${userId}: ${filePath}`);

      res.status(200).json({
        success: true,
        message: 'Plik został pomyślnie usunięty'
      });

    } catch (error) {
      logger.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas usuwania pliku'
      });
    }
  }

  /**
   * Pobiera informacje o pliku
   */
  static async getFileInfo(req: Request, res: Response): Promise<void> {
    try {
      const { filePath } = req.params;
      
      if (!filePath) {
        res.status(400).json({
          success: false,
          message: 'Ścieżka pliku jest wymagana'
        });
        return;
      }

      const fileInfo = await fileUploadService.getFileInfo(filePath);
      
      res.status(200).json({
        success: true,
        fileInfo
      });

    } catch (error) {
      logger.error('Error getting file info:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas pobierania informacji o pliku'
      });
    }
  }

  /**
   * Middleware do obsługi błędów multer
   */
  static handleMulterError(error: any, req: Request, res: Response, next: NextFunction): void {
    if (error instanceof Error) {
      if (error.message.includes('File too large')) {
        res.status(400).json({
          success: false,
          message: 'Plik jest zbyt duży'
        });
        return;
      }
      
      if (error.message.includes('Invalid file type')) {
        res.status(400).json({
          success: false,
          message: 'Nieprawidłowy typ pliku'
        });
        return;
      }
    }

    logger.error('Multer error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas przesyłania pliku'
    });
  }
}