'use client';

import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, MapPin, AlertCircle, Clock } from 'lucide-react';

export function AIConcierge({ itinerary }: { itinerary: any }) {
  const { language } = useI18n();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude},${position.coords.longitude}`);
        },
        (error) => {
          console.error("Location error", error);
          setLocation("Dubai, UAE"); // Fallback
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!location) return;

    // 2. Fetch Contextual Suggestion
    async function getSuggestion() {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
        
        const prompt = `It is currently ${new Date().toLocaleTimeString()}. 
        The traveler is at ${location}. 
        Their itinerary: ${JSON.stringify(itinerary)}. 
        Provide one proactive short suggestion, e.g., location based for pharmacy, restaurant, weather, or event. 
        The user's preferred language is ${language}. Respond ONLY in ${language === 'ar' ? 'Arabic' : 'English'}.
        Be concise.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: { includeServerSideToolInvocations: true }
          }
        });

        setSuggestion(response.text || (language === 'ar' ? "كل شيء يبدو جيداً في رحلتك!" : "Everything looks good for your trip!"));
      } catch (err) {
        console.error(err);
        setSuggestion(language === 'ar' ? "استمتع برحلتك!" : "Enjoy your trip!");
      } finally {
        setLoading(false);
      }
    }
    getSuggestion();
  }, [location, itinerary, language]);

  if (loading) return (
    <Card className="bg-zinc-900/50 border border-emerald-500/20 rounded-xl p-4">
      <Loader2 className="animate-spin h-5 w-5 text-emerald-500" />
    </Card>
  );

  return (
    <Card className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl shadow-lg">
      <CardContent className="p-4 flex gap-3">
        <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className='space-y-1'>
          <CardTitle className='text-sm text-emerald-100'>Your AI Concierge</CardTitle>
          <p className="text-sm text-emerald-200/80 font-normal leading-relaxed">{suggestion}</p>
        </div>
      </CardContent>
    </Card>
  );
}
