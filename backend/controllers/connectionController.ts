import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import UserRelation, { IUserRelation } from '../models/UserRelation';
import { NotFoundError, ValidationError } from '../utils/errors';

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

interface PopulatedRelation extends Omit<IUserRelation, 'fromUser' | 'toUser'> {
  _id: Types.ObjectId;
  fromUser: PopulatedUser;
  toUser?: PopulatedUser;
  status: 'pending' | 'accepted' | 'rejected';
}

// Create or update a user relation (placeholder or real user)
export const addOrUpdateRelation = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const { toUser: toUserId, relationType, isPlaceholder, nickname, description } = req.body;
    const fromUserId = req.user?._id;

    if (!fromUserId) throw new ValidationError('User not authenticated');

    const validRelations = ['mother', 'father', 'sibling', 'spouse', 'child'];
    if (!validRelations.includes(relationType)) {
      throw new ValidationError('Invalid relation type');
    }

    if (isPlaceholder) {
      if (!nickname) {
        throw new ValidationError('Nickname is required for placeholder relations');
      }

      const existingPlaceholder = await UserRelation.findOne({
        fromUser: fromUserId,
        nickname,
        relationType,
        isPlaceholder: true
      });

      if (existingPlaceholder) {
        existingPlaceholder.nickname = nickname;
        existingPlaceholder.description = description || existingPlaceholder.description;
        await existingPlaceholder.save();

        return res.status(200).json({ success: true, relation: existingPlaceholder, message: 'Placeholder updated' });
      }

      const placeholderRelation = await UserRelation.create({
        fromUser: fromUserId,
        nickname,
        description,
        relationType,
        isPlaceholder: true,
        status: 'accepted',
        placeholderId: new Types.ObjectId().toString()
      });

      return res.status(201).json({ success: true, relation: placeholderRelation });
    }

    if (!toUserId || !Types.ObjectId.isValid(toUserId)) {
      throw new ValidationError('Invalid target user ID');
    }

    if (fromUserId.equals(toUserId)) {
      throw new ValidationError('Cannot create relation with yourself');
    }

    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId)
    ]);

    if (!fromUser || !toUser) throw new NotFoundError('User not found');

    const relation = await UserRelation.create({
      fromUser: fromUserId,
      toUser: toUserId,
      relationType,
      nickname,
      description,
      status: 'pending'
    });

    await relation.populate('fromUser toUser', 'username fullName profilePicture');

    res.status(201).json({ success: true, relation });
  } catch (error) {
    next(error);
  }
};

// Get all outgoing accepted relations for a user
export const getUserRelations = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId ? new Types.ObjectId(req.params.userId) : req.user?._id;
    if (!userId) throw new ValidationError('User ID is required');

    const relations = await UserRelation.find({
      fromUser: userId,
      status: 'accepted'
    }).populate<{ toUser?: PopulatedUser }>('toUser', 'username fullName profilePicture');

    const formattedRelations = relations.map((relation) => {
      return {
        _id: relation._id,
        toUser: relation.toUser || null,
        fullName: relation.toUser?.fullName || relation.nickname || '',
        relationType: relation.relationType,
        nickname: relation.nickname || '',
        description: relation.description || '',
        isPlaceholder: relation.isPlaceholder,
        status: relation.status
      };
    });

    res.json({ success: true, relations: formattedRelations });
  } catch (error) {
    next(error);
  }
};

// Get pending incoming requests for the authenticated user
export const getPendingRequests = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw new ValidationError('User not authenticated');

    const requests = await UserRelation.find({
      toUser: userId,
      status: 'pending'
    }).populate('fromUser', 'username fullName profilePicture');

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// Accept a connection request
export const acceptRequest = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;

    if (!userId) throw new ValidationError('User not authenticated');
    if (!Types.ObjectId.isValid(requestId)) throw new ValidationError('Invalid request ID');

    const relation = await UserRelation.findOne({
      _id: new Types.ObjectId(requestId),
      toUser: userId,
      status: 'pending'
    }).populate('fromUser toUser', 'username fullName profilePicture');

    if (!relation) throw new NotFoundError('Connection request not found');

    relation.status = 'accepted';
    await relation.save();

    res.json({ success: true, relation });
  } catch (error) {
    next(error);
  }
};

// Reject a connection request
export const rejectRequest = async (req: Request & { user?: RequestUser }, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;

    if (!userId) throw new ValidationError('User not authenticated');
    if (!Types.ObjectId.isValid(requestId)) throw new ValidationError('Invalid request ID');

    const relation = await UserRelation.findOneAndUpdate(
      {
        _id: new Types.ObjectId(requestId),
        toUser: userId,
        status: 'pending'
      },
      { status: 'rejected' },
      { new: true }
    );

    if (!relation) throw new NotFoundError('Connection request not found');

    res.json({ success: true, message: 'Connection request rejected' });
  } catch (error) {
    next(error);
  }
};
