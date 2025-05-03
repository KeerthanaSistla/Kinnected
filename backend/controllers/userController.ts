import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import User from '../models/User';
import { NotFoundError, ValidationError } from '../utils/errors';

type UpdateableUserFields = Pick<IUser, 'fullName' | 'email' | 'phoneNumber' | 'bio' | 'location' | 'profilePicture' | 'privacySettings' | 'familyTreePreferences' | 'notificationSettings' | 'relationManagementSettings' | 'appPreferences'>;

// Get user profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username || req.user?.username;
    
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allowedUpdates: (keyof UpdateableUserFields)[] = ['fullName', 'email', 'phoneNumber', 'bio', 'location', 'profilePicture', 'privacySettings', 'familyTreePreferences', 'notificationSettings', 'relationManagementSettings', 'appPreferences'];
    const updates = Object.keys(req.body) as (keyof UpdateableUserFields)[];
    
    // Validate update fields
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      throw new ValidationError('Invalid updates');
    }

    // Get user and update
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Apply updates in a type-safe way
    updates.forEach(field => {
      if (field in req.body) {
        (user as any)[field] = req.body[field];
      }
    });

    await user.save();
    
    // Return updated user (excluding password)
    const updatedUser = user.toObject();
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// Search users
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required');
    }

    // Search by username, fullName, or email
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username fullName profilePicture')
    .limit(10);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.deleteOne();

    // Clear auth cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};