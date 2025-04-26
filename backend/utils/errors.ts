export class CustomError extends Error {
  statusCode: number;
  errors?: string[];
  code?: string;
  field?: string;

  constructor(message: string, statusCode = 500, errors?: string[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.code = 'NOT_FOUND';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.code = 'AUTHENTICATION_ERROR';
  }
}

export class ValidationError extends CustomError {
  constructor(message = 'Validation failed', errors?: string[], field?: string) {
    super(message, 400, errors);
    this.code = 'VALIDATION_ERROR';
    this.field = field;
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
    this.code = 'FORBIDDEN';
  }
}

export class ConflictError extends CustomError {
  constructor(message = 'Resource conflict', field?: string) {
    super(message, 409);
    this.code = 'CONFLICT';
    this.field = field;
  }
}

export class ServerError extends CustomError {
  constructor(message = 'Internal server error') {
    super(message, 500);
    this.code = 'SERVER_ERROR';
  }
}

// Error utility functions
export const createValidationError = (field: string, message: string): ValidationError => {
  const error = new ValidationError(`Validation failed: ${field}`, [message], field);
  return error;
};

export const createConflictError = (field: string, message: string): ConflictError => {
  const error = new ConflictError(message, field);
  return error;
};