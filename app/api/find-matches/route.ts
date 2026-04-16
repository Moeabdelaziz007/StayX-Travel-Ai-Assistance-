import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { profileA, profileB } = await request.json();

    if (!profileA || !profileB) {
      return NextResponse.json({ error: 'Missing profiles' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Rate compatibility between these two travelers on a scale of 0-100 and explain why.
      Traveler A: ${JSON.stringify(profileA)}.
      Traveler B: ${JSON.stringify(profileB)}.
      Return JSON: { score: number, reasons: string[], commonInterests: string[], potentialChallenges: string[] }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: { type: SchemaType.NUMBER },
            reasons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            commonInterests: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            potentialChallenges: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
          },
          required: ['score', 'reasons', 'commonInterests', 'potentialChallenges']
        }
      }
    });

    const resultText = response.text || "{}";
    const result = JSON.parse(resultText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error finding matches:', error);
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
  }
}
