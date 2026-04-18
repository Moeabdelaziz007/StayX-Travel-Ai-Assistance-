import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { profileA, profileB } = await request.json();

    if (!profileA || !profileB) {
      return NextResponse.json({ error: 'Missing profiles' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `Rate compatibility between these two travelers on a scale of 0-100 and explain why.
Traveler A: ${JSON.stringify(profileA)}.
Traveler B: ${JSON.stringify(profileB)}.
Return JSON structure: { "score": number, "reasons": string[], "commonInterests": string[], "potentialChallenges": string[] }`
        }]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            score: { type: 'NUMBER' },
            reasons: { type: 'ARRAY', items: { type: 'STRING' } },
            commonInterests: { type: 'ARRAY', items: { type: 'STRING' } },
            potentialChallenges: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['score', 'reasons', 'commonInterests', 'potentialChallenges']
        }
      }
    });

    return NextResponse.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error('Error finding matches:', error);
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
  }
}
