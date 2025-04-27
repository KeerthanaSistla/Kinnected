import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import User from '../models/User';
import { ValidationError, AuthenticationError } from '../utils/errors';
import type { IUser } from '../models/User';
import { Types } from 'mongoose';
import { validatePassword } from '../utils/passwordValidator';
import { validateEmail } from '../utils/emailValidator';
import bcrypt from 'bcryptjs';

interface IUserDocument extends IUser {
  comparePassword(candidatePassword: string): Promise<boolean>;
  _id: Types.ObjectId;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
export const register = async (req: Request, res: Response) => {
  try {
    const { username, name, email, password } = req.body;
    
    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        errors: {
          username: 'Username already taken'
        }
      });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        errors: {
          email: 'Email already registered'
        }
      });
    }
    
    // Create new user - password will be hashed by the pre-save hook
    const user = await User.create({
      username,
      name,
      email,
      password // This will be hashed by the pre-save hook
    });
    
    // Generate token
    const token = generateToken(user._id as Types.ObjectId);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);
    console.log('Received password length:', password ? password.length : 0);
    
    // Find user by username and explicitly select password field
    const user = await User.findOne({ username }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('Username not found:', username);
      return res.status(401).json({
        success: false,
        errors: {
          username: 'Invalid username or password'
        }
      });
    }
    
    if (!user.password) {
      console.error('Password field not loaded for user:', username);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
    
    // Check password
    console.log('Comparing passwords...');
    console.log('Stored password hash:', user.password.substring(0, 10) + '...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({
        success: false,
        errors: {
          password: 'Invalid username or password'
        }
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful for user:', username);
    
    // Remove password from user object before sending response
    const userWithoutPassword = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email
    };
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
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
