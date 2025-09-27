import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getProfile, 
  updateProfile, 
  getPublicProfile 
} from '../controllers/profileController';

const router = express.Router();

// Protected routes (require authentication)
router.get('/me', authenticateToken, getProfile);
router.put('/me', authenticateToken, updateProfile);

// Public routes
router.get('/:id', getPublicProfile);

export default router;