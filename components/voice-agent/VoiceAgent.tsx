'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export function VoiceAgent() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

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
        if (transcript) handleProcessSpeech(transcript);
      };
    }
  }, [transcript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }, [isListening]);

  useEffect(() => {
    const handleStartVoice = () => {
      if (!isListening) {
        toggleListening();
      }
    };
    window.addEventListener('start-voice-agent', handleStartVoice);
    return () => window.removeEventListener('start-voice-agent', handleStartVoice);
  }, [isListening, toggleListening]);

  const handleProcessSpeech = async (text: string) => {
    setIsProcessing(true);
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `You are StayX Voice Assistant, a travel AI. When the user asks about flights, hotels, or trips:
1. Extract: origin city, destination city, dates, passengers
2. Return JSON: {intent: 'flight'|'hotel'|'trip'|'general', origin, destination, date, response}
3. Keep spoken responses under 3 sentences — this is voice, not text
4. Be conversational and friendly
User said: "${text}"`;
      
      const result = await model.generateContent(prompt);
      const jsonResponse = JSON.parse(result.response.text());
      
      // Handle intent
      let spokenResponse = jsonResponse.response;
      
      if (jsonResponse.intent === 'flight' || jsonResponse.intent === 'hotel') {
        const endpoint = jsonResponse.intent === 'flight' ? '/api/amadeus/flights' : '/api/amadeus/hotels';
        const res = await fetch(`${endpoint}?origin=${jsonResponse.origin}&destination=${jsonResponse.destination}&date=${jsonResponse.date}`);
        const data = await res.json();
        spokenResponse = `I found some options for you. ${data.slice(0, 3).map((item: any) => `${item.name} for ${item.price}`).join(', ')}.`;
      }

      const utterance = new SpeechSynthesisUtterance(spokenResponse);
      window.speechSynthesis.speak(utterance);
      
    } catch (e) {
      console.error(e);
      toast.error("Failed to process voice command");
    } finally {
      setIsProcessing(false);
    }
  };

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
