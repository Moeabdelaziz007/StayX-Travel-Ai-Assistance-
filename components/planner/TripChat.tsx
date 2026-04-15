'use client';
import { useState } from 'react';
import { ChatMessage } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TripChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export function TripChat({ messages, onSendMessage, isLoading }: TripChatProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-zinc-950 p-4">
      <ScrollArea className="flex-1 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-600' : 'bg-zinc-800'}`}>
              {m.content}
            </span>
          </div>
        ))}
      </ScrollArea>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." />
        <Button onClick={handleSend} disabled={isLoading}>Send</Button>
      </div>
    </div>
  );
}
