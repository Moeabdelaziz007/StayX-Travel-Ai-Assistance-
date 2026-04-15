'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

import Image from 'next/image';

interface BuddyCardProps {
  match: any;
  onConnect: (matchId: string, otherUserId: string) => void;
  onPass: (matchId: string) => void;
  otherUser: any;
}

export function BuddyCard({ match, onConnect, onPass, otherUser }: BuddyCardProps) {
  const [actionTaken, setActionTaken] = useState<'connect' | 'pass' | null>(null);

  const handleConnect = () => {
    setActionTaken('connect');
    onConnect(match.id, otherUser.userId);
  };

  const handlePass = () => {
    setActionTaken('pass');
    onPass(match.id);
  };

  if (actionTaken) {
    return null; // Or some animation
  }

  const score = match.compatibilityScore || 0;
  const strokeDasharray = `${score} 100`;

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden w-full max-w-sm mx-auto">
      <div className="relative h-48 bg-zinc-800 flex items-center justify-center">
        {otherUser.photoURL ? (
          <Image 
            src={otherUser.photoURL} 
            alt={otherUser.name || 'User'} 
            fill 
            className="object-cover" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="h-24 w-24 text-zinc-600" />
        )}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full w-16 h-16 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-14 h-14 circular-chart text-green-500">
            <path
              className="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#333"
              strokeWidth="3"
            />
            <path
              className="circle"
              strokeDasharray={strokeDasharray}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <text x="18" y="20.35" className="percentage text-[10px] fill-white text-center" textAnchor="middle">
              {score}%
            </text>
          </svg>
        </div>
        <div className="absolute bottom-4 left-4">
          <Badge className="bg-blue-600 hover:bg-blue-700">{otherUser.destination}</Badge>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2">{otherUser.name || 'Traveler'} {otherUser.age ? `, ${otherUser.age}` : ''}</h3>
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{otherUser.bio}</p>
        
        <div className="space-y-2 mb-6">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase">Top Compatibility Reasons</h4>
          <div className="flex flex-wrap gap-2">
            {match.compatibilityReasons?.slice(0, 3).map((reason: string, i: number) => (
              <Badge key={i} variant="outline" className="bg-zinc-800/50 text-xs font-normal border-zinc-700">
                {reason}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 border-red-900/50 hover:bg-red-900/20 text-red-400" onClick={handlePass}>
            <X className="mr-2 h-4 w-4" /> Pass
          </Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleConnect}>
            <Check className="mr-2 h-4 w-4" /> Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
