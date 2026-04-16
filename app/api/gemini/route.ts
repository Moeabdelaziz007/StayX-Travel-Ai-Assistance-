import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Initialize with server-side only key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt, tools } = await req.json();

    // Note: Simple rate limiting should be implemented via middleware or Firestore 
    // for production. For this demonstration, we focus on safe API wrapping.

    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      ...tools && { tools },
    });

    // In a real app, you'd handle streaming here. 
    // For simplicity, we return a standard response.
    const result = await model.generateContent({
        contents: messages
    });

    return NextResponse.json({ response: result.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to process Gemini request' }, { status: 500 });
  }
}
