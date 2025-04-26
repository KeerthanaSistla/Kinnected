import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

interface LoginData {
  username: string;
  password: string;
}

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, fullName }: RegisterData = req.body;
    const errors: string[] = [];

    // Username validation
    if (!username || username.length < 3 || username.length > 30) {
      errors.push('Username must be between 3 and 30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    // Email validation
    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push('Please provide a valid email address');
    }

    // Password validation
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain both letters and numbers');
    }

    // Full name validation
    if (!fullName || fullName.trim().length < 2 || fullName.trim().length > 50) {
      errors.push('Full name must be between 2 and 50 characters');
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password }: LoginData = req.body;
    const errors: string[] = [];

    // Username validation
    if (!username) {
      errors.push('Username is required');
    }

    // Password validation
    if (!password) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateConnection = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toUser, relationType } = req.body;
    const errors: string[] = [];

    if (!toUser) {
      errors.push('Target user is required');
    }

    const validRelations = ['parent', 'child', 'sibling', 'spouse', 'mother', 'father'];
    if (!relationType || !validRelations.includes(relationType)) {
      errors.push('Invalid relation type');
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  } catch (error) {
    next(error);
  }
};