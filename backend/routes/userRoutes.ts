import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import {
  updateProfile,
  searchUsers,
  getUserProfile,
  deleteAccount
} from '../controllers/userController';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get user profile
router.get('/profile/:username?', getUserProfile);

// Update user profile
router.put('/profile', updateProfile);

// Search for users
router.get('/search', searchUsers);

// Delete account
router.delete('/account', deleteAccount);

export default router;
