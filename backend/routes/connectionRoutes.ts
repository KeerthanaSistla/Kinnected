import express, { Request } from 'express';
import { Types } from 'mongoose';
import { verifyToken } from '../middleware/authMiddleware';
import { validateConnection } from '../middleware/validationMiddleware';
import {
  addOrUpdateRelation,
  getUserRelations,
  getPendingRequests,
  acceptRequest,
  rejectRequest
} from '../controllers/connectionController';

interface RequestUser {
  _id: Types.ObjectId;
  [key: string]: any;
}

const router = express.Router();

// Protect all routes with authentication
router.use(verifyToken);

// Get all relations for a user (if userId not provided, gets current user's relations)
router.get('/relations/:userId?', getUserRelations as express.RequestHandler);

// Get pending connection requests for current user
router.get('/pending', getPendingRequests as express.RequestHandler);

// Add or update a relation
router.post('/', validateConnection, addOrUpdateRelation as express.RequestHandler);

// Accept a connection request
router.patch('/accept/:requestId', acceptRequest as express.RequestHandler);

// Reject a connection request
router.patch('/reject/:requestId', rejectRequest as express.RequestHandler);

export default router;
