import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Create a limiter for general API endpoints
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Create a limiter for authentication routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Create a limiter for AI routes
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 requests per hour
    message: {
        success: false,
        message: 'AI query limit reached, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});