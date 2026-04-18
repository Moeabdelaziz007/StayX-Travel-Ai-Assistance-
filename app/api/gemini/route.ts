import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt, tools } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Initialize inside the handler
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Note: Simple rate limiting should be implemented via middleware or Firestore 
    // for production. For this demonstration, we focus on safe API wrapping.

    // In a real app, you'd handle streaming here. 
    // For simplicity, we return a standard response.
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: messages,
      ...tools && { tools },
    });

    return NextResponse.json({ response: result.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to process Gemini request' }, { status: 500 });
  }
}
