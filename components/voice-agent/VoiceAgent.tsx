'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import { useI18n } from '@/lib/i18n';
import { safeFetchJson } from '@/lib/fetch-utils';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export function VoiceAgent() {
  const { language } = useI18n();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleProcessSpeech = useCallback(async (text: string) => {
    setIsProcessing(true);
    try {
      const prompt = `You are StayX Voice Assistant, a travel AI. The user's current language preference is ${language}.
Always respond in ${language === 'ar' ? 'Arabic' : 'English'}.
When the user asks about flights, hotels, or trips:
1. Extract: origin city, destination city, dates, passengers
2. Return JSON: {intent: 'flight'|'hotel'|'trip'|'general', origin, destination, date, response}
3. Keep spoken responses under 3 sentences — this is voice, not text
4. Be conversational and friendly
User said: "${text}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      const jsonResponse = JSON.parse(response.text);
      
      // Handle intent
      let spokenResponse = jsonResponse.response;
      
      if (jsonResponse.intent === 'flight' || jsonResponse.intent === 'hotel') {
        const endpoint = jsonResponse.intent === 'flight' ? '/api/amadeus/flights' : '/api/amadeus/hotels';
        const data = await safeFetchJson(`${endpoint}?origin=${jsonResponse.origin}&destination=${jsonResponse.destination}&date=${jsonResponse.date}`);
        
        if (data && Array.isArray(data)) {
          spokenResponse = language === 'ar' 
            ? `لقد وجدت بعض الخيارات لك. ${data.slice(0, 3).map((item: any) => `${item.name} مقابل ${item.price}`).join('، ')}.`
            : `I found some options for you. ${data.slice(0, 3).map((item: any) => `${item.name} for ${item.price}`).join(', ')}.`;
        } else {
          spokenResponse = language === 'ar' ? "لم أتمكن من العثور على أي خيارات حالياً." : "I couldn't find any options right now.";
        }
      }

      const utterance = new SpeechSynthesisUtterance(spokenResponse);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      window.speechSynthesis.speak(utterance);
      
    } catch (e) {
      console.error(e);
      toast.error(language === 'ar' ? "فشل في معالجة الأمر الصوتي" : "Failed to process voice command");
    } finally {
      setIsProcessing(false);
    }
  }, [language]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Access latest transcript value via a stable ref if needed, or by ensuring state is correct.
        // Actually onend happens after onresult, but we need the latest transcript.
      };
    }
  }, []);

  // Use a ref for the transcript to be used in onend without re-triggering effect
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcriptRef.current) handleProcessSpeech(transcriptRef.current);
      };
    }
  }, [handleProcessSpeech]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }, [isListening, language]);

  useEffect(() => {
    const handleStartVoice = () => {
      if (!isListening) {
        toggleListening();
      }
    };
    window.addEventListener('start-voice-agent', handleStartVoice);
    return () => window.removeEventListener('start-voice-agent', handleStartVoice);
  }, [isListening, toggleListening]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={toggleListening}
        className={`rounded-full h-16 w-16 shadow-2xl transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'}`}
      >
        {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : isListening ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
      </Button>
      {transcript && (
        <div className="absolute bottom-20 right-0 w-64 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white shadow-xl">
          {transcript}
        </div>
      )}
    </div>
  );
}
