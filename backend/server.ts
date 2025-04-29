import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Route imports
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import connectionRoutes from './routes/connectionRoutes';
import aiRoutes from './routes/ai';

// Middleware imports
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter';
import { CustomError } from './utils/errors';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:8081'], // Add port 8081
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler - Move this after all routes
app.use((req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.url
  });
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = err.errors ? Object.values(err.errors)
      .map((error: any) => error.message)
      .filter((msg: string | null) => msg !== null) : ['Validation failed'];
    
    console.log('Validation errors:', errors);
    
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: errors.length > 0 ? errors : ['Invalid input data']
    });
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    console.log('Duplicate key error:', field);
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      field,
      details: [`This ${field} is already in use. Please choose another one.`]
    });
  }
  
  // Handle other errors
  console.log('Other error:', err.message);
  
  // For Gemini API errors, return a more specific error message
  if (err.message && err.message.includes('GoogleGenerativeAI')) {
    return res.status(500).json({
      success: false,
      message: err.message,
      details: err.errorDetails || 'Error with Gemini API'
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kinnected:kinnected@cluster0.8j8j8j8.mongodb.net/kinnected?retryWrites=true&w=majority';

// Start server with enhanced error handling and port fallback
const PORT = Number(process.env.PORT) || 5000;
const startServer = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    console.log('MongoDB URI:', MONGODB_URI);
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = PORT + 1;
        console.log(`Port ${PORT} is busy, trying ${nextPort}...`);
        app.listen(nextPort, () => {
          console.log(`🚀 Server is running on port ${nextPort}`);
          console.log(`📡 API Base URL: http://localhost:${nextPort}/api`);
        });
      } else {
        throw err;
      }
    });
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();
