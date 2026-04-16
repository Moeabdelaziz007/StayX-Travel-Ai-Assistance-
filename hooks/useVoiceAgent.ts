'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from 'sonner';

const MODEL = "gemini-2.0-flash-exp";

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking';

export function useVoiceAgent() {
  const [state, setState] = useState<VoiceState>('idle');
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // ... (the rest of the code)
  
  // Inside startSession:
  // const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

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
    setTranscript('');
    isPlayingRef.current = false;
    audioQueueRef.current = [];
  }, []);

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

    try {
      const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      
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
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              setTranscript(prev => prev + ' ' + message.serverContent?.modelTurn?.parts[0].text);
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
          systemInstruction: "You are StayX, an expert AI travel assistant. You speak naturally in Arabic and English. You help users plan trips, find flights, check weather, and answer travel questions. When users mention a destination, proactively suggest: 1) best time to visit, 2) must-do activities, 3) estimated budget. Keep responses under 30 seconds. Be warm and enthusiastic. Use the provided tools to get real-time information.",
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
      toast.error("Could not access microphone or connect to AI");
      stopSession();
    }
  }, [isActive, stopSession, playNextInQueue, googleToken]);

  return {
    isActive,
    state,
    transcript,
    startSession,
    stopSession,
    connectCalendar,
    hasCalendar: !!googleToken
  };
}
