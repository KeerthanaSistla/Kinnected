// Simple test script to verify the Gemini API key
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Replace with your API key
const API_KEY = "AIzaSyCUzhk_ce-z7YjXgr1fyhpj4pprVw7D27o";

async function testGeminiAPI() {
  try {
    console.log("Testing Gemini API with key:", API_KEY);
    
    // Initialize the model
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Generate a simple response
    const result = await model.generateContent("Hello, how are you?");
    const response = await result.response;
    const text = response.text();
    
    console.log("Success! Response from Gemini:", text);
  } catch (error) {
    console.error("Error testing Gemini API:", error);
  }
}

// Run the test
testGeminiAPI(); 