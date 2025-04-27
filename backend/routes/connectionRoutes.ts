import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { Types } from 'mongoose';
import { verifyToken } from '../middleware/authMiddleware';
import { validateConnection } from '../middleware/validationMiddleware';
import {
  addOrUpdateRelation,
  getUserRelations,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
} from '../controllers/connectionController';
import { searchUsers } from '../controllers/userController';

const router = express.Router();

// Protect all routes with authentication
router.use(verifyToken);

// Add request validation middleware with proper types
router.param('requestId', ((req: Request, res: Response, next: NextFunction, requestId: string) => {
  if (!Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid request ID format' 
    });
  }
  next();
}) as RequestHandler);

router.param('userId', ((req: Request, res: Response, next: NextFunction, userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid user ID format' 
    });
  }
  next();
}) as RequestHandler);

// Get user's relations and search
router.get('/relations/:userId?', getUserRelations as RequestHandler);
router.get('/search/users', searchUsers as RequestHandler);

// Manage connection requests
router.get('/pending', getPendingRequests as RequestHandler);
router.patch('/accept/:requestId', acceptRequest as RequestHandler);
router.patch('/reject/:requestId', rejectRequest as RequestHandler);

// Add or update relations
router.post('/', validateConnection as RequestHandler, addOrUpdateRelation as RequestHandler);

export default router;