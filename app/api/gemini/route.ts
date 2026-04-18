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
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: messages,
      config: {
        ...(tools && { tools }),
        ...(systemPrompt && { systemInstruction: systemPrompt })
      }
    });

    return NextResponse.json({ response: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('429') && error.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'Quota exceeded. Please check your Gemini API plan.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: 'Failed to process Gemini request' }, { status: 500 });
  }
}
