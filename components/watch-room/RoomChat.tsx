'use client';

import { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import { generateWithGroq } from '@/lib/groq';
import { useI18n } from '@/lib/i18n';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

interface Message {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  isAI?: boolean;
  timestamp: any;
}

interface RoomChatProps {
  roomId: string;
}

export function RoomChat({ roomId }: RoomChatProps) {
  const { t, language } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, `rooms/${roomId}/messages`),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}/messages`);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleAIResponse = async (query: string) => {
    try {
      const systemInstruction = `You are a friendly travel guide in a watch party. Users are watching travel content together. Answer travel questions concisely in 2-3 sentences. ${language === 'ar' ? 'Please respond in Arabic.' : 'Please respond in English.'}`;
      let responseText = '';

      if (process.env.GROQ_API_KEY) {
        responseText = await generateWithGroq(query, systemInstruction, "llama3-8b-8192");
      } else {
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts: [{ text: query }] }],
          config: {
            systemInstruction,
          }
        });
        responseText = result.text || "";
      }

      await addDoc(collection(db, `rooms/${roomId}/messages`), {
        uid: 'ai-bot',
        displayName: 'StayX Guide',
        text: responseText,
        isAI: true,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("Failed to get AI response");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `rooms/${roomId}/messages`), {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'User',
        text,
        timestamp: serverTimestamp(),
      });

      if (text.toLowerCase().includes('@ai')) {
        const aiQuery = text.replace(/@ai/gi, '').trim();
        if (aiQuery) {
          handleAIResponse(aiQuery);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
        <h3 className="font-bold text-white flex items-center gap-2">
          {language === 'ar' ? 'الدردشة المباشرة' : 'Live Chat'}
        </h3>
        <p className="text-xs text-zinc-400">
          {language === 'ar' ? 'اكتب @ai لسؤال المرشد السياحي' : 'Type @ai to ask the travel guide'}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.uid === auth.currentUser?.uid ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-8 w-8 border border-zinc-700">
                {msg.isAI ? (
                  <div className="bg-emerald-500/20 h-full w-full flex items-center justify-center text-emerald-500">
                    <Bot className="h-4 w-4" />
                  </div>
                ) : (
                  <AvatarFallback className="bg-zinc-800 text-xs">
                    {msg.displayName.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className={`flex flex-col ${msg.uid === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-zinc-500 mb-1">{msg.displayName}</span>
                <div className={`px-3 py-2 rounded-2xl max-w-[200px] sm:max-w-[250px] text-sm ${
                  msg.isAI 
                    ? 'bg-emerald-500/10 text-emerald-50 border border-emerald-500/20 rounded-tl-sm' 
                    : msg.uid === auth.currentUser?.uid
                      ? 'bg-rose-600 text-white rounded-tr-sm'
                      : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 bg-zinc-900/80 border-t border-zinc-800">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
            className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500"
          />
          <Button type="submit" size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
