'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, update, set, serverTimestamp } from 'firebase/database';
import { SyncedPlayer } from './SyncedPlayer';
import { RoomChat } from './RoomChat';
import { Button } from '@/components/ui/button';
import { Share2, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { useI18n } from '@/lib/i18n';

interface RoomData {
  hostUid: string;
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  participants: { [uid: string]: boolean };
}

interface WatchTogetherRoomProps {
  roomId: string;
}

export function WatchTogetherRoom({ roomId }: WatchTogetherRoomProps) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        setParticipantCount(Object.keys(data.participants || {}).length);
      }
    });

    // Join room
    const participantRef = ref(rtdb, `rooms/${roomId}/participants/${user.uid}`);
    set(participantRef, true);

    return () => {
      unsubscribe();
      // Leave room (optional, could use onDisconnect)
    };
  }, [roomId, user]);

  const handleStateChange = (state: { isPlaying: boolean; currentTime: number }) => {
    if (roomData?.hostUid === user?.uid) {
      const roomRef = ref(rtdb, `rooms/${roomId}`);
      update(roomRef, {
        isPlaying: state.isPlaying,
        currentTime: state.currentTime,
      });
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    toast.success("Room link copied to clipboard!");
  };

  if (!roomData) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const isHost = roomData.hostUid === user?.uid;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 px-6 flex items-center justify-between backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-tighter">{language === 'ar' ? 'حفلة مشاهدة ستاي إكس' : 'StayX Watch Party'}</h2>
            <p className="text-[10px] text-zinc-500 font-mono">{language === 'ar' ? 'معرف الغرفة' : 'ROOM ID'}: {roomId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700">
            <Users className="h-4 w-4 text-green-500" />
            <span className="text-xs font-bold">{participantCount}</span>
          </div>
          <Button 
            onClick={handleShare}
            className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-full gap-2 text-xs h-9"
          >
            <Share2 className="h-4 w-4" /> {language === 'ar' ? 'مشاركة' : 'Share'}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex min-h-0">
        {/* Player Section */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-black/40">
          <div className="w-full max-w-5xl">
            <SyncedPlayer 
              videoId={roomData.videoId}
              isPlaying={roomData.isPlaying}
              currentTime={roomData.currentTime}
              isHost={isHost}
              onStateChange={handleStateChange}
            />
            <div className="mt-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">{language === 'ar' ? 'مشاهدة فيديو سفر' : 'Watching Travel Vlog'}</h1>
                <p className="text-sm text-zinc-500">{language === 'ar' ? 'المضيف' : 'Host'}: {isHost ? (language === 'ar' ? 'أنت' : 'You') : (language === 'ar' ? 'مسافر آخر' : 'Another Traveler')}</p>
              </div>
              {isHost && (
                <Badge className="bg-green-600/20 text-green-500 border-green-500/30">{language === 'ar' ? 'عناصر تحكم المضيف نشطة' : 'Host Controls Active'}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-96 border-l border-zinc-800 p-4">
          <RoomChat roomId={roomId} />
        </div>
      </main>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${className}`}>
      {children}
    </span>
  );
}
