'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

const MODEL = "gemini-3-flash-preview";

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function useVoiceAgent() {
  const [state, setState] = useState<VoiceState>('idle');
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  
  const router = useRouter();
  const { setLanguage, language } = useI18n();

  const playBeep = useCallback((freq: number, duration: number = 0.1) => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio feedback failed", e);
    }
  }, []);

  const handleQuickCommands = useCallback((text: string): boolean => {
    const lower = text.toLowerCase();
    
    // Arabic commands
    if (lower.includes('افتح الداشبورد') || lower.includes('الرئيسية') || lower.includes('dashboard')) {
      router.push('/dashboard');
      toast.success("Opening Dashboard");
      return true;
    }
    if (lower.includes('شغل غرفة مشاهدة') || lower.includes('غرفة المشاهدة') || lower.includes('watch room')) {
      router.push('/watch');
      toast.success("Opening Watch Room");
      return true;
    }
    if (lower.includes('غير اللغة') || lower.includes('تغيير اللغة') || lower.includes('change language')) {
      const nextLang = language === 'ar' ? 'en' : 'ar';
      setLanguage(nextLang);
      toast.success(`Language changed to ${nextLang === 'ar' ? 'العربية' : 'English'}`);
      return true;
    }
    
    return false;
  }, [router, language, setLanguage]);

  const connectCalendar = async () => {
    const { loginWithCalendar } = await import('@/lib/firebase');
    try {
      await loginWithCalendar();
      toast.success("Calendar connected!");
      setGoogleToken("MOCK_TOKEN"); 
    } catch (e) {
      toast.error("Failed to connect calendar");
    }
  };
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setState('idle');
    playBeep(440, 0.15); // End beep
    isPlayingRef.current = false;
    audioQueueRef.current = [];
  }, [playBeep]);

  const playNextInQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current || !audioContextRef.current) {
      if (audioQueueRef.current.length === 0 && isPlayingRef.current) {
        isPlayingRef.current = false;
        setState('listening');
      }
      return;
    }

    isPlayingRef.current = true;
    setState('speaking');

    const ctx = audioContextRef.current;
    const chunk = audioQueueRef.current.shift()!;
    
    const audioBuffer = ctx.createBuffer(1, chunk.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < chunk.length; i++) {
      channelData[i] = chunk[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      playNextInQueue();
    };
    source.start();
  }, []);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startSession = useCallback(async () => {
    if (isActive) return;
    
    setIsActive(true);
    setState('connecting');
    setTranscript('');
    playBeep(880, 0.1); // Start beep

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      
      const sessionPromise = ai.live.connect({
        model: MODEL,
        callbacks: {
          onopen: async () => {
            setState('listening');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;
            
            const source = ctx.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              const base64Data = arrayBufferToBase64(pcmData.buffer);
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=24000' }
                });
              });
            };
            
            source.connect(processor);
            processor.connect(ctx.destination);

            // Send context/history if any
            if (history.length > 0) {
              const context = history.map(h => `${h.role}: ${h.text}`).join('\n');
              sessionPromise.then(session => session.send({
                text: `CONTEXT FROM PREVIOUS TURN:\n${context}\n\nPlease continue the conversation naturally based on this history.`
              }));
            }
          },
          onmessage: async (message: any) => {
            // Transcription part
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              const text = message.serverContent?.modelTurn?.parts[0].text;
              setTranscript(prev => prev + ' ' + text);
              
              // Local command check on transcript
              if (handleQuickCommands(text)) {
                // Should we interrupt Gemini? Navigation will typically unload page anyway.
                window.location.reload(); // Quick way to stop everything if needed, but router.push is better
              }

              // Update history
              setHistory(prev => {
                const newHistory = [...prev, { role: 'model', text }] as Message[];
                return newHistory.slice(-20);
              });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const binary = atob(base64Audio);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              playNextInQueue();
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              setState('listening');
              playBeep(220, 0.05); // Interrupted feedback
            }

            if (message.toolCall) {
              setState('processing');
              const results = [];
              for (const call of message.toolCall.functionCalls) {
                let result;
                try {
                  if (call.name === "searchWeather") {
                    const { getWeather } = await import('@/lib/travel-tools');
                    result = await getWeather({ location: call.args.destination });
                  } else if (call.name === "searchFlights") {
                    const { searchFlights } = await import('@/lib/travel-tools');
                    result = await searchFlights(call.args);
                  } else if (call.name === "planTrip") {
                    const { generateDetailedItinerary } = await import('@/lib/travel-tools');
                    result = await generateDetailedItinerary(call.args);
                  } else if (call.name === "searchYouTube") {
                    result = { url: `/watch?q=${encodeURIComponent(call.args.destination)}`, message: "I've opened the travel feed for you." };
                  } else if (call.name === "addToCalendar") {
                    const { addToCalendar } = await import('@/lib/travel-tools');
                    result = await addToCalendar({ ...call.args, accessToken: googleToken });
                    toast.success(result.message);
                  } else if (call.name === "searchSimCards") {
                    const { searchSimCards } = await import('@/lib/travel-tools');
                    result = await searchSimCards(call.args);
                  } else if (call.name === "searchHotels") {
                    const { searchHotels } = await import('@/lib/travel-tools');
                    result = await searchHotels(call.args);
                  } else if (call.name === "generateDestinationImage") {
                    const { generateDestinationImage } = await import('@/lib/travel-tools');
                    result = await generateDestinationImage(call.args);
                  } else if (call.name === "getCountryInfo") {
                    const { getCountryInfo } = await import('@/lib/travel-tools');
                    result = await getCountryInfo(call.args);
                  }
                } catch (e) {
                  result = { error: "Failed to execute tool" };
                }
                results.push({ name: call.name, response: result, id: call.id });
              }
              sessionPromise.then(session => session.sendToolResponse({ functionResponses: results }));
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            playBeep(110, 0.3); // Error beep
            toast.error("Voice connection error");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: `You are StayX, a multilingual travel expert (Arabic, English, French, Spanish). 
          - Automatically detect user language and respond in the same language.
          - If the user context is missing, remember their last destination or request (Conversational Memory).
          - Be PROACTIVE: After answering, suggest the logical next step (e.g., after flight search, suggest hotels or weather).
          - Example: If user says "Dubai", then "5 days", you know it's 5 days in Dubai.
          - Multi-turn Example: After flight results -> "Would you like me to find some top-rated hotels in Dubai for your dates as well?"
          - Keep responses warm, enthusiastic, and under 30 seconds.
          - Use tools for real-time data.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [
            {
              functionDeclarations: [
                {
                  name: "searchWeather",
                  description: "Get current weather for a destination",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      destination: { type: "STRING", description: "The city and country" }
                    },
                    required: ["destination"]
                  }
                },
                {
                  name: "searchFlights",
                  description: "Search for flights between cities",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      origin: { type: "STRING" },
                      destination: { type: "STRING" },
                      date: { type: "STRING", description: "ISO date string" }
                    },
                    required: ["origin", "destination", "date"]
                  }
                },
                {
                  name: "planTrip",
                  description: "Generate a detailed trip itinerary",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      destination: { type: "STRING" },
                      days: { type: "NUMBER" },
                      budget: { type: "STRING", enum: ["budget", "moderate", "luxury"] }
                    },
                    required: ["destination", "days", "budget"]
                  }
                },
                {
                  name: "searchYouTube",
                  description: "Get travel videos for a destination",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      destination: { type: "STRING" }
                    },
                    required: ["destination"]
                  }
                },
                {
                  name: "addToCalendar",
                  description: "Add a trip or booking to the user's calendar",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      description: { type: "STRING" },
                      startTime: { type: "STRING", description: "ISO date string" },
                      endTime: { type: "STRING", description: "ISO date string" },
                      location: { type: "STRING" }
                    },
                    required: ["title", "startTime", "endTime"]
                  }
                },
                {
                  name: "searchSimCards",
                  description: "Search for travel SIM cards or eSIMs for a destination",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      destination: { type: "STRING" }
                    },
                    required: ["destination"]
                  }
                },
                {
                  name: "searchHotels",
                  description: "Search for hotels in a destination",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      destination: { type: "STRING" },
                      checkIn: { type: "STRING", description: "ISO date string" },
                      checkOut: { type: "STRING", description: "ISO date string" }
                    },
                    required: ["destination", "checkIn", "checkOut"]
                  }
                },
                {
                  name: "generateDestinationImage",
                  description: "Generate an AI image of a travel destination or landmark",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      prompt: { type: "STRING", description: "Detailed description of the image to generate" }
                    },
                    required: ["prompt"]
                  }
                },
                {
                  name: "getCountryInfo",
                  description: "Get detailed information about a country (population, capital, flag, etc.)",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      countryName: { type: "STRING" }
                    },
                    required: ["countryName"]
                  }
                }
              ]
            }
          ]
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err) {
      console.error("Failed to start voice session:", err);
      playBeep(110, 0.3);
      toast.error("Could not access microphone or connect to AI");
      stopSession();
    }
  }, [isActive, stopSession, playNextInQueue, googleToken, history, playBeep, handleQuickCommands]);

  return {
    isActive,
    state,
    transcript,
    history,
    startSession,
    stopSession,
    connectCalendar,
    hasCalendar: !!googleToken
  };
}
