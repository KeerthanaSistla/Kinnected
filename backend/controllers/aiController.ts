import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ValidationError } from '../utils/errors';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Helper function to validate API key
const validateApiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
};

// Process relationship query
export const processQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateApiKey();
    
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required');
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate response
    const result = await model.generateContent(`
      Act as a family relationship advisor.
      Question: ${query}
      Provide advice about family relationships, connections, and family dynamics.
      Keep the response concise, practical, and focused on maintaining healthy family relationships.
      Avoid any harmful or inappropriate advice.
    `);

    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      response: text
    });
  } catch (error) {
    next(error);
  }
};

// Get relationship suggestions
export const getRelationshipSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateApiKey();
    
    const { relation, context } = req.body;
    if (!relation) {
      throw new ValidationError('Relation type is required');
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate suggestions
    const result = await model.generateContent(`
      Act as a family relationship advisor.
      Provide 3-5 specific suggestions for maintaining and improving a ${relation} relationship.
      Additional context: ${context || 'General advice'}
      Keep suggestions practical, positive, and focused on strengthening family bonds.
      Format as bullet points.
    `);

    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      suggestions: text
    });
  } catch (error) {
    next(error);
  }
};