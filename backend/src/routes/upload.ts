import express from 'express';
import { FileUploadController } from '../controllers/fileUploadController';
import { fileUploadService } from '../services/fileUploadService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware do obsługi błędów multer
router.use(FileUploadController.handleMulterError);

/**
 * @route POST /api/upload/avatar
 * @desc Przesyła avatar użytkownika
 * @access Private
 */
router.post('/avatar', 
  authenticateToken,
  fileUploadService.createUploadMiddleware('avatar').single('avatar'),
  FileUploadController.uploadAvatar
);

/**
 * @route POST /api/upload/cover
 * @desc Przesyła okładkę profilu/biznesu
 * @access Private
 */
router.post('/cover',
  authenticateToken,
  fileUploadService.createUploadMiddleware('cover').single('cover'),
  FileUploadController.uploadCover
);

/**
 * @route POST /api/upload/video
 * @desc Przesyła wideo
 * @access Private
 */
router.post('/video',
  authenticateToken,
  fileUploadService.createUploadMiddleware('video').single('video'),
  FileUploadController.uploadVideo
);

/**
 * @route POST /api/upload/document
 * @desc Przesyła dokument
 * @access Private
 */
router.post('/document',
  authenticateToken,
  fileUploadService.createUploadMiddleware('document').single('document'),
  FileUploadController.uploadDocument
);

/**
 * @route DELETE /api/upload/file
 * @desc Usuwa plik
 * @access Private
 */
router.delete('/file',
  authenticateToken,
  FileUploadController.deleteFile
);

/**
 * @route GET /api/upload/info/:filePath
 * @desc Pobiera informacje o pliku
 * @access Private
 */
router.get('/info/:filePath',
  authenticateToken,
  FileUploadController.getFileInfo
);

export default router;