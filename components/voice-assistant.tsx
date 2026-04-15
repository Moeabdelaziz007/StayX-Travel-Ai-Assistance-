'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, Volume2, Settings2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ensureUserProfile, updateUserPreferences, bookTrip, addAppointment, inviteFriend, toggleFavorite, placeOrder, getWeather, convertCurrency, translateText, searchGroundingCompare } from '@/lib/travel-tools';
import { base64ToFloat32Array, float32ArrayToBase64 } from '@/lib/audio-utils';
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const tools: FunctionDeclaration[] = [
  {
    name: 'updateUserPreferences',
    description: 'Update the user\'s voice tone or budget preference based on their requests.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        voiceTone: { type: Type.STRING, enum: ['professional', 'friendly', 'energetic', 'calm'], description: 'The preferred voice tone.' },
        budgetPreference: { type: Type.STRING, enum: ['budget', 'moderate', 'luxury'], description: 'The preferred budget level.' }
      }
    }
  },
  {
    name: 'bookTrip',
    description: 'Book a trip for the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        destination: { type: Type.STRING, description: 'The destination of the trip.' },
        startDate: { type: Type.STRING, description: 'Start date in ISO format (e.g. 2024-10-15).' },
        endDate: { type: Type.STRING, description: 'End date in ISO format (e.g. 2024-10-22).' },
        budget: { type: Type.NUMBER, description: 'The budget for the trip.' }
      },
      required: ['destination']
    }
  },
  {
    name: 'addAppointment',
    description: 'Add an appointment or schedule item for the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Title of the appointment.' },
        date: { type: Type.STRING, description: 'Date and time in ISO format (e.g. 2024-10-15T19:30:00Z).' },
        type: { type: Type.STRING, enum: ['restaurant', 'nightclub', 'flight', 'hotel', 'cinema', 'event', 'other'], description: 'Type of the appointment.' },
        details: { type: Type.STRING, description: 'Additional details or location.' },
        price: { type: Type.NUMBER, description: 'The price or cost of the booking if applicable.' }
      },
      required: ['title', 'date', 'type']
    }
  },
  {
    name: 'inviteFriend',
    description: 'Invite a friend to a booking.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        receiverEmail: { type: Type.STRING, description: 'The email of the friend to invite.' },
        bookingId: { type: Type.STRING, description: 'The ID of the trip or appointment.' },
        bookingType: { type: Type.STRING, enum: ['trip', 'appointment'], description: 'The type of booking.' }
      },
      required: ['receiverEmail', 'bookingId', 'bookingType']
    }
  },
  {
    name: 'toggleFavorite',
    description: 'Add a song or video to favorites.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: { type: Type.STRING, description: 'The ID of the item (e.g. YouTube ID).' },
        type: { type: Type.STRING, enum: ['music', 'video'], description: 'The type of item.' },
        title: { type: Type.STRING, description: 'The title of the item.' },
        thumbnail: { type: Type.STRING, description: 'The thumbnail URL.' }
      },
      required: ['itemId', 'type', 'title']
    }
  },
  {
    name: 'placeOrder',
    description: 'Place a shopping order.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemName: { type: Type.STRING, description: 'The name of the item to buy.' },
        price: { type: Type.NUMBER, description: 'The price of the item.' },
        currency: { type: Type.STRING, description: 'The currency code (e.g. USD).' }
      },
      required: ['itemName', 'price', 'currency']
    }
  },
  {
    name: 'getWeather',
    description: 'Check the weather for a location.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: 'The city or location.' },
        date: { type: Type.STRING, description: 'The date for the forecast.' }
      },
      required: ['location']
    }
  },
  {
    name: 'convertCurrency',
    description: 'Convert money between currencies.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'The amount to convert.' },
        from: { type: Type.STRING, description: 'The source currency code.' },
        to: { type: Type.STRING, description: 'The target currency code.' }
      },
      required: ['amount', 'from', 'to']
    }
  },
  {
    name: 'translateText',
    description: 'Translate text to another language.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'The text to translate.' },
        targetLanguage: { type: Type.STRING, description: 'The language to translate to.' }
      },
      required: ['text', 'targetLanguage']
    }
  },
  {
    name: 'searchGroundingCompare',
    description: 'Search and compare prices for flights, hotels, or travel deals across major booking websites.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The search query (e.g. "Flights to Tokyo in December").' }
      },
      required: ['query']
    }
  }
];

export function VoiceAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm StayX, your personal travel assistant. I'm connecting to the Live API..." }
  ]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [voiceTone, setVoiceTone] = useState('Kore');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const nextPlayTimeRef = useRef<number>(0);
  const isMicActiveRef = useRef(isMicActive);

  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  const playAudioChunk = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    const audioCtx = audioContextRef.current;
    
    const float32Array = base64ToFloat32Array(base64Audio);
    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    
    if (nextPlayTimeRef.current < audioCtx.currentTime) {
      nextPlayTimeRef.current = audioCtx.currentTime;
    }
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  const disconnectLiveAPI = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
    }
  };

  const connectLiveAPI = async (profile: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      mediaStreamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0; // Mute mic playback
      
      processor.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      processorRef.current = processor;

      const systemInstruction = `You are StayX, a highly capable, proactive personal travel AI assistant. 
User Name: ${profile?.name || 'Traveler'}
Preferred Budget: ${profile?.budgetPreference || 'moderate'}
Personality: ${profile?.voiceTone || 'friendly'}

You have advanced reasoning and problem-solving abilities. You can search the web for live hotel and ticket prices, give recommendations, and manage bookings.
Always be concise, helpful, and friendly. 

CRITICAL: When you successfully perform an action using a tool (like booking a trip, adding an appointment, or placing an order), provide a brief voice confirmation to the user (e.g., "Done! I've booked your trip to Tokyo.").

You have access to Google Search for real-time information.`;

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceTone } },
          },
          systemInstruction,
          tools: [{ googleSearch: {} }, { functionDeclarations: tools }]
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setMessages([{ role: 'assistant', content: "Connected! You can start speaking now." }]);
            
            processor.onaudioprocess = (e) => {
              if (!isMicActiveRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const base64Data = float32ArrayToBase64(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            source.connect(processor);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playAudioChunk(base64Audio);
            }
            
            // Handle interruption
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = 0;
            }
            
            // Handle transcriptions
            const modelText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (modelText) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant') {
                  return [...prev.slice(0, -1), { role: 'assistant', content: last.content + modelText }];
                }
                return [...prev, { role: 'assistant', content: modelText }];
              });
            }

            // Handle tool calls
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls) {
                const functionResponses = await Promise.all(functionCalls.map(async (call) => {
                  let result;
                  try {
                    if (call.name === 'updateUserPreferences') {
                      result = await updateUserPreferences(call.args as any);
                      toast.success("Preferences updated!");
                    } else if (call.name === 'bookTrip') {
                      result = await bookTrip(call.args as any);
                      toast.success("Trip booked!");
                    } else if (call.name === 'addAppointment') {
                      result = await addAppointment(call.args as any);
                      toast.success("Appointment added!");
                    } else if (call.name === 'inviteFriend') {
                      result = await inviteFriend(call.args as any);
                      toast.success("Invitation sent!");
                    } else if (call.name === 'toggleFavorite') {
                      result = await toggleFavorite(call.args as any);
                      toast.success("Added to favorites!");
                    } else if (call.name === 'placeOrder') {
                      result = await placeOrder(call.args as any);
                      toast.success("Order placed!");
                    } else if (call.name === 'getWeather') {
                      result = await getWeather(call.args as any);
                    } else if (call.name === 'convertCurrency') {
                      result = await convertCurrency(call.args as any);
                    } else if (call.name === 'translateText') {
                      result = await translateText(call.args as any);
                    } else if (call.name === 'searchGroundingCompare') {
                      result = await searchGroundingCompare(call.args as any);
                      toast.success("Search comparison complete!");
                    } else {
                      result = { error: 'Unknown function' };
                    }
                  } catch (e: any) {
                    result = { error: e.message };
                    toast.error(`Error: ${e.message}`);
                  }
                  return {
                    id: call.id,
                    name: call.name,
                    response: result
                  };
                }));
                
                sessionPromise.then(session => {
                  session.sendToolResponse({ functionResponses });
                });
              }
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            toast.error("Connection error");
          },
          onclose: () => {
            console.log("Live API closed");
          }
        }
      });
      
      sessionRef.current = sessionPromise;
      
    } catch (e) {
      console.error("Error setting up audio:", e);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await ensureUserProfile();
        setUserProfile(profile);
        await connectLiveAPI(profile);
      } catch (e) {
        console.error("Failed to init:", e);
        setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to Live API. Please check your microphone permissions." }]);
        setIsConnecting(false);
      }
    };
    init();
    
    return () => {
      disconnectLiveAPI();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    setIsMicActive(!isMicActive);
  };

  return (
    <div className="absolute bottom-24 right-6 w-96 rounded-3xl border border-zinc-800 bg-[#151619] shadow-2xl flex flex-col overflow-hidden z-50">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isConnecting ? 'bg-zinc-800' : 'bg-green-500/10'}`}>
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : <Volume2 className="h-4 w-4 text-green-500" />}
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">StayX Live</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Real-time Voice</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={voiceTone} onValueChange={(v: string | null) => v && setVoiceTone(v)}>
            <SelectTrigger className="w-[100px] h-8 text-[10px] font-mono bg-zinc-900 border-zinc-800 text-zinc-400">
              <SelectValue placeholder="Voice" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-400">
              <SelectItem value="Kore">Kore</SelectItem>
              <SelectItem value="Puck">Puck</SelectItem>
              <SelectItem value="Charon">Charon</SelectItem>
              <SelectItem value="Fenrir">Fenrir</SelectItem>
              <SelectItem value="Zephyr">Zephyr</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96 p-4 bg-zinc-950/50" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs font-mono ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-white rounded-br-none' 
                  : 'bg-zinc-900 text-zinc-400 rounded-bl-none border border-zinc-800'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-zinc-800 bg-[#151619] p-8 flex justify-center">
        <button 
          onClick={toggleMic}
          className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isMicActive 
              ? 'bg-red-500/10 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
              : 'bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          {isMicActive ? (
            <Mic className="h-10 w-10 text-red-500 animate-pulse" />
          ) : (
            <MicOff className="h-10 w-10 text-zinc-600" />
          )}
          {isMicActive && (
            <div className="absolute -inset-2 rounded-full border border-red-500/20 animate-ping" />
          )}
        </button>
      </div>
    </div>
  );
}