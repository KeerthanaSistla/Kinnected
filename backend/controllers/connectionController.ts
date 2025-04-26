import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import UserRelation, { IUserRelation } from '../models/UserRelation';
import { NotFoundError, ValidationError } from '../utils/errors';

interface RequestUser {
  _id: Types.ObjectId;
  [key: string]: any;
}

// Add or update a relation between users
export const addOrUpdateRelation = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const { toUser: toUserId, relationType } = req.body;
    const fromUserId = req.user?._id;

    if (!fromUserId) {
      throw new ValidationError('User not authenticated');
    }

    if (!toUserId || !Types.ObjectId.isValid(toUserId)) {
      throw new ValidationError('Invalid target user ID');
    }

    // Validate users exist
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId)
    ]);

    if (!fromUser || !toUser) {
      throw new NotFoundError('User not found');
    }

    // Check if relation already exists
    let relation = await UserRelation.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId }
      ]
    });

    if (relation) {
      // Update existing relation if status is 'rejected'
      if (relation.status === 'rejected') {
        relation.fromUser = fromUserId;
        relation.toUser = new Types.ObjectId(toUserId);
        relation.relationType = relationType;
        relation.status = 'pending';
        await relation.save();
      } else {
        throw new ValidationError('Relation already exists');
      }
    } else {
      // Create new relation
      relation = await UserRelation.create({
        fromUser: fromUserId,
        toUser: new Types.ObjectId(toUserId),
        relationType,
        status: 'pending'
      });
    }

    await relation.populate('fromUser toUser', 'username fullName profilePicture');

    res.status(201).json({
      success: true,
      relation
    });
  } catch (error) {
    next(error);
  }
};

// Get all relations for a user
export const getUserRelations = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId ? new Types.ObjectId(req.params.userId) : req.user?._id;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const relations = await UserRelation.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'accepted'
    }).populate('fromUser toUser', 'username fullName profilePicture');

    res.json({
      success: true,
      relations
    });
  } catch (error) {
    next(error);
  }
};

// Get pending connection requests
export const getPendingRequests = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const requests = await UserRelation.find({
      toUser: userId,
      status: 'pending'
    }).populate('fromUser', 'username fullName profilePicture');

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// Accept a connection request
export const acceptRequest = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    if (!Types.ObjectId.isValid(requestId)) {
      throw new ValidationError('Invalid request ID');
    }

    const relation = await UserRelation.findOne({
      _id: new Types.ObjectId(requestId),
      toUser: userId,
      status: 'pending'
    });

    if (!relation) {
      throw new NotFoundError('Connection request not found');
    }

    relation.status = 'accepted';
    await relation.save();
    
    await relation.populate('fromUser toUser', 'username fullName profilePicture');

    res.json({
      success: true,
      relation
    });
  } catch (error) {
    next(error);
  }
};

// Reject a connection request
export const rejectRequest = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    if (!Types.ObjectId.isValid(requestId)) {
      throw new ValidationError('Invalid request ID');
    }

    const relation = await UserRelation.findOne({
      _id: new Types.ObjectId(requestId),
      toUser: userId,
      status: 'pending'
    });

    if (!relation) {
      throw new NotFoundError('Connection request not found');
    }

    relation.status = 'rejected';
    await relation.save();

    res.json({
      success: true,
      message: 'Connection request rejected'
    });
  } catch (error) {
    next(error);
  }
};