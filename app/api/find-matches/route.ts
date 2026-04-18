import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { profileA, profileB } = await request.json();

    if (!profileA || !profileB) {
      return NextResponse.json({ error: 'Missing profiles' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-preview',
      contents: `Rate compatibility between these two travelers on a scale of 0-100 and explain why.
      Traveler A: ${JSON.stringify(profileA)}.
      Traveler B: ${JSON.stringify(profileB)}.
      Return JSON: { score: number, reasons: string[], commonInterests: string[], potentialChallenges: string[] }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            commonInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
            potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['score', 'reasons', 'commonInterests', 'potentialChallenges']
        }
      }
    });

    const resultText = response.text || "{}";
    const result = JSON.parse(resultText);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error finding matches:', error);
    
    // Check for RESOURCE_EXHAUSTED quota error
    if (error.message && error.message.includes('429') && error.message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'You have exceeded your Gemini API quota. Please check your Google Cloud plan and billing details.' },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: 'Failed to find matches: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
