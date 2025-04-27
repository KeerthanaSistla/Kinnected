import { Request, Response, NextFunction } from 'express';
import { Types, Document } from 'mongoose';
import User from '../models/User';
import UserRelation, { IUserRelation } from '../models/UserRelation';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';

interface RequestUser {
  _id: Types.ObjectId;
  [key: string]: any;
}

interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  fullName: string;
  profilePicture?: string;
}

// Update PopulatedRelation to properly handle populated fields
interface PopulatedRelation extends Omit<IUserRelation, 'fromUser' | 'toUser'> {
  _id: Types.ObjectId;
  fromUser: PopulatedUser;
  toUser?: PopulatedUser;
  status: 'pending' | 'accepted' | 'rejected';
}

// Add or update a relation between users
export const addOrUpdateRelation = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const { toUser: toUserId, relationType, isPlaceholder, fullName, nickname, description } = req.body;
    const fromUserId = req.user?._id;

    if (!fromUserId) {
      throw new ValidationError('User not authenticated');
    }

    // Validate relationType
    const validRelations = ['mother', 'father', 'sibling', 'spouse', 'child'];
    if (!validRelations.includes(relationType)) {
      throw new ValidationError('Invalid relation type');
    }

    // Handle placeholder relation
    if (isPlaceholder) {
      if (!fullName && !nickname) {
        throw new ValidationError('Either full name or nickname is required for placeholder relations');
      }

      // Check if a similar placeholder relation already exists
      const existingPlaceholder = await UserRelation.findOne({
        fromUser: fromUserId,
        fullName: fullName || nickname,
        relationType,
        isPlaceholder: true
      });

      if (existingPlaceholder) {
        // Update the existing placeholder instead of creating a new one
        existingPlaceholder.nickname = nickname || existingPlaceholder.nickname;
        existingPlaceholder.description = description || existingPlaceholder.description;
        await existingPlaceholder.save();
        
        return res.status(200).json({
          success: true,
          relation: existingPlaceholder,
          message: 'Placeholder relation updated'
        });
      }

      // Create a new placeholder relation
      const placeholderRelation = await UserRelation.create({
        fromUser: fromUserId,
        fullName: fullName || nickname,
        nickname,
        description,
        relationType,
        isPlaceholder: true,
        status: 'accepted',
        placeholderId: new Types.ObjectId().toString() // Generate a unique placeholder ID
      });

      return res.status(201).json({
        success: true,
        relation: placeholderRelation
      });
    }

    // Handle real user relation
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

    // Prevent self-connection
    if (fromUserId.equals(toUserId)) {
      throw new ValidationError('Cannot create a relation with yourself');
    }

    // Create new relation
    const relation = await UserRelation.create({
      fromUser: fromUserId,
      toUser: toUserId,
      relationType,
      nickname,
      description,
      status: 'pending'
    });

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
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ],
      status: 'accepted'
    }).populate<{ fromUser: PopulatedUser, toUser?: PopulatedUser }>('fromUser toUser', 'username fullName profilePicture');

    // Format relations to match frontend expectation
    const formattedRelations = relations.map((relation) => {
      const typedRelation = relation as unknown as PopulatedRelation;
      let toUser: PopulatedUser | null = null;
      let fullName = typedRelation.fullName || '';

      if (!typedRelation.isPlaceholder) {
        if (typedRelation.fromUser._id.equals(userId)) {
          toUser = typedRelation.toUser || null;
          fullName = typedRelation.toUser?.fullName || '';
        } else {
          toUser = typedRelation.fromUser;
          fullName = typedRelation.fromUser.fullName;
        }
      }

      return {
        _id: typedRelation._id,
        toUser,
        fullName,
        relationType: typedRelation.relationType,
        nickname: typedRelation.nickname || '',
        description: typedRelation.description || '',
        isPlaceholder: typedRelation.isPlaceholder,
        status: typedRelation.status
      };
    });

    res.json({
      success: true,
      relations: formattedRelations
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
    }).populate('fromUser toUser', 'username fullName profilePicture');

    if (!relation) {
      throw new NotFoundError('Connection request not found');
    }

    relation.status = 'accepted';
    await relation.save();

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

    const relation = await UserRelation.findOneAndUpdate(
      {
        _id: new Types.ObjectId(requestId),
        toUser: userId,
        status: 'pending'
      },
      { status: 'rejected' },
      { new: true }
    );

    if (!relation) {
      throw new NotFoundError('Connection request not found');
    }

    res.json({
      success: true,
      message: 'Connection request rejected'
    });
  } catch (error) {
    next(error);
  }
};