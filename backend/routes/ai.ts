import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { processQuery, getRelationshipSuggestions } from '../controllers/aiController';

const router = express.Router();

// Protect all routes
router.use(verifyToken);

// Process general relationship queries
router.post('/query', processQuery);

// Get specific relationship suggestions
router.post('/suggestions', getRelationshipSuggestions);

export default router;
