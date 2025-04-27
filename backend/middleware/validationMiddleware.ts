import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  username: string;
  password: string;
}

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, name }: RegisterData = req.body;
    const errors: { [key: string]: string } = {};

    // Username validation
    if (!username) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    // Name validation
    if (!name) {
      errors.name = 'Name is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password }: LoginData = req.body;
    const errors: { [key: string]: string } = {};

    if (!username) {
      errors.username = 'Username is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
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