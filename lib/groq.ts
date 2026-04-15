import Groq from 'groq-sdk';

// Initialize Groq client
// Note: In a real app, you'd want to handle the case where the API key is missing more gracefully
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key',
});

export async function generateWithGroq(prompt: string, systemPrompt: string = "You are a helpful assistant.", model: string = "llama3-8b-8192") {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error calling Groq API:", error);
    // Fallback or throw
    throw new Error("Failed to generate content with Groq");
  }
}
