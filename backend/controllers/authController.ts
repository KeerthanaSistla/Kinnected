import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import User from '../models/User';
import { ValidationError, AuthenticationError } from '../utils/errors';
import type { IUser } from '../models/User';
import { Types } from 'mongoose';

interface IUserDocument extends IUser {
  comparePassword(candidatePassword: string): Promise<boolean>;
  _id: Types.ObjectId;
}

// Generate JWT token
const generateToken = (userId: Types.ObjectId): string => {
  const jwtSecret: Secret = process.env.JWT_SECRET || 'default-secret';
  
  return jwt.sign(
    { userId: userId.toString() },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

// Register user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new ValidationError('Username already exists');
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName
    }) as IUserDocument;

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.COOKIE_EXPIRE || '7') * 24 * 60 * 60 * 1000
    });

    // Return user data (excluding password)
    const { password: _, ...userData } = user.toObject();
    res.status(201).json({
      success: true,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    // Find user by username and include password for comparison
    const user = await User.findOne({ username }).select('+password') as IUserDocument | null;
    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.COOKIE_EXPIRE || '7') * 24 * 60 * 60 * 1000
    });

    // Return user data (excluding password)
    const { password: _, ...userData } = user.toObject();
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = (req: Request, res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
