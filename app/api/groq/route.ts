import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt, model } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: model || "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    return NextResponse.json({ content: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
