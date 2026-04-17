import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. AI features will be disabled.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function generateProductDescription(productName, category) {
  if (!genAI) {
    return `A beautiful ${productName} from our ${category} collection.`;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Generate a concise and appealing product description for an e-commerce store. 
  The product is "${productName}" and it belongs to the "${category}" category. 
  Focus on luxury, elegance, and craftsmanship. Keep it under 50 words.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Error generating product description with Gemini API:', error);
    return `A beautiful ${productName} from our ${category} collection.`;
  }
}
