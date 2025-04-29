import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ValidationError } from '../utils/errors';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not configured');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
let model: GenerativeModel;

try {
  model = genAI.getGenerativeModel({
    model: "models/gemini-1.5-pro",
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    },
  });
  console.log('✅ Gemini AI model initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI model:', error);
  process.exit(1);
}

// App description for prompt context
const kinnectedAppDescription = `
Kinnected is a social family tree platform that helps users build and explore their family network.
Key features include:
- Interactive tree with connections like parent, sibling, spouse, and child
- Public details (name, phone, email) and private info (nickname, description)
- Nodes connect through confirmed relationships
- Users can search and add relatives with "+" icons
- Clicking a node recenters the tree view
- An assistant helps with app usage, family structure, and relationship insights
`;

// Greeting check
const isGreeting = (text: string): boolean => {
  const greetings = ['hi', 'hello', 'hey', 'hola', 'yo', 'greetings'];
  return greetings.includes(text.trim().toLowerCase());
};

// Chat message processing
export const processChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required');
    }

    if (isGreeting(message)) {
      return res.json({
        success: true,
        response: "Hey there! 👋 How can I help you explore your family or navigate the Kinnected app today?"
      });
    }

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    const prompt = `
You are a friendly assistant inside the Kinnected app.

App background:
${kinnectedAppDescription}

User message: "${message}"

Respond in a helpful, clear tone. Focus on:
- App usage questions (e.g., adding relatives, tree navigation)
- Family relationship understanding
- Avoid counseling-style or generic therapy advice
- No markdown or formatting characters like asterisks
- Keep it concise and clean
`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    res.json({ success: true, response: text });
  } catch (error) {
    console.error("Error in processChatMessage:", error);
    next(error);
  }
};

// Relationship reasoning query (e.g., "Who is X to me?")
export const processQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string');
    }

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    const prompt = `
You are an AI assistant in Kinnected, a family networking app.

App background:
${kinnectedAppDescription}

User query: "${query}"

Respond with:
- An explanation of the possible family relationship
- Simple, conversational tone
- No markdown or formatting symbols
- App-relevant examples if helpful
`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    res.json({ success: true, response: text });
  } catch (error: any) {
    console.error('AI query error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI query'
    });
  }
};

// Suggestions for strengthening a specific relationship
export const getRelationshipSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { relation, context } = req.body;
    if (!relation) {
      throw new ValidationError('Relation type is required');
    }

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    const prompt = `
You are helping users on Kinnected strengthen their relationship with a ${relation}.

App context:
${kinnectedAppDescription}

User context: ${context || 'No additional context'}

Give 3–5 friendly, practical ideas to strengthen this relationship.
Focus on:
- Shared activities
- Communication tips
- Staying in touch
Avoid therapy jargon or long analysis. No formatting symbols like asterisks.
`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    res.json({
      success: true,
      response: text
    });
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate suggestions'
    });
  }
};
