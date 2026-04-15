import { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Itinerary } from '@/types/planner';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

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
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          ...newMessages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        ],
        config: {
          systemInstruction: "You are a travel planning assistant. Collect info: destination, dates, duration, budget, travelers, interests. If info is missing, ask follow-up questions (max 3). Once complete, output JSON itinerary.",
        }
      });

      const aiResponse = response.text || "";
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
