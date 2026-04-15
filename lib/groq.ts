// Groq API wrapper
// Note: In a real app, you'd want to handle the case where the API key is missing more gracefully
export async function generateWithGroq(prompt: string, systemPrompt: string = "You are a helpful assistant.", model: string = "llama3-8b-8192") {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemPrompt, model }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch from Groq API');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Error calling Groq API wrapper:", error);
    throw error;
  }
}
