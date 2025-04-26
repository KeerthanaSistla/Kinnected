import express from 'express';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware';
import { verifyToken } from '../middleware/authMiddleware';
import {
  register,
  login,
  logout,
  getCurrentUser
} from '../controllers/authController';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

export default router;
