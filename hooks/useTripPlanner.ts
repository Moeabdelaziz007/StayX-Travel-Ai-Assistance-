import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Itinerary } from '@/types/planner';
import { generateWithGroq } from '@/lib/groq';

export function useTripPlanner() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! Tell me about your dream trip — where to, when, how many days, and what's your budget?" }
  ]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    const newMessages = [...messages, { role: 'user', content } as ChatMessage];
    setMessages(newMessages);

    try {
      let aiResponse = "";
      const systemInstruction = "You are a travel planning assistant. Collect info: destination, dates, duration, budget, travelers, interests. If info is missing, ask follow-up questions (max 3). Once complete, output JSON itinerary.";
      const prompt = newMessages.map(m => `${m.role}: ${m.content}`).join("\n");

      if (process.env.GROQ_API_KEY) {
        try {
          aiResponse = await generateWithGroq(prompt, systemInstruction, "llama3-70b-8192");
        } catch (groqError) {
          console.warn("Groq failed in planner, falling back to Gemini", groqError);
        }
      }

      if (!aiResponse) {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) throw new Error("API key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            systemInstruction
          }
        });
        aiResponse = result.text || "";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Check if it's JSON (the itinerary)
      if (aiResponse.trim().startsWith('{')) {
        setItinerary(JSON.parse(aiResponse));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, itinerary, isLoading, sendMessage };
}
