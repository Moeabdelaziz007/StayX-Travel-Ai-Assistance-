'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { rtdb } from '@/lib/firebase';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Send } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

interface Message {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  isAI: boolean;
  timestamp: number;
}

interface RoomChatProps {
  roomId: string;
}

export function RoomChat({ roomId }: RoomChatProps) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAIResponseRef = useRef<number>(0);

  useEffect(() => {
    const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const text = input.trim();
    setInput('');

    const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
    await push(messagesRef, {
      uid: user.uid,
      displayName: user.displayName || 'Traveler',
      text,
      isAI: false,
      timestamp: serverTimestamp(),
    });

    if (text.startsWith('@AI')) {
      const now = Date.now();
      if (now - lastAIResponseRef.current < 10000) {
        toast.error("AI is busy. Please wait 10 seconds.");
        return;
      }
      lastAIResponseRef.current = now;
      handleAIResponse(text.replace('@AI', '').trim());
    }
  };

  const handleAIResponse = async (query: string) => {
    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        systemInstruction: `You are a friendly travel guide in a watch party. Users are watching travel content together. Answer travel questions concisely in 2-3 sentences. ${language === 'ar' ? 'Please respond in Arabic.' : 'Please respond in English.'}`,
      });

      const responseText = result.response.text();
      const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        uid: 'ai-bot',
        displayName: 'StayX Guide',
        text: responseText,
        isAI: true,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("AI Error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
          {language === 'ar' ? 'دردشة الغرفة' : 'Room Chat'}
        </h3>
        <span className="text-[10px] text-zinc-500 font-mono">{language === 'ar' ? 'مباشر' : 'LIVE'}</span>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isAI ? 'items-center' : ''}`}>
              <div className={`flex gap-3 max-w-[90%] ${msg.isAI ? 'bg-purple-900/20 border border-purple-500/30 p-3 rounded-2xl' : ''}`}>
                {!msg.isAI && (
                  <Avatar className="h-8 w-8 border border-zinc-800">
                    <AvatarFallback className="text-[10px]">{msg.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${msg.isAI ? 'text-purple-400' : 'text-zinc-400'}`}>
                      {msg.displayName}
                    </span>
                    {msg.isAI && (
                      <span className="bg-purple-600 text-[8px] px-1.5 py-0.5 rounded-full text-white font-bold flex items-center gap-1">
                        <Sparkles className="h-2 w-2" /> AI
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${msg.isAI ? 'text-zinc-200 italic' : 'text-zinc-300'}`}>
                    {msg.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex gap-2">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'ar' ? 'اكتب @AI لسؤال المرشد...' : 'Type @AI to ask the guide...'}
          className="bg-zinc-950 border-zinc-800 text-xs h-10"
        />
        <Button type="submit" size="icon" className="h-10 w-10 bg-green-600 hover:bg-green-700">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
