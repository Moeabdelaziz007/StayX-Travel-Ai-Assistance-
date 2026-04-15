'use client';

import { useParams } from 'next/navigation';
import { WatchTogetherRoom } from '@/components/watch-room/WatchTogetherRoom';
import { useAuth } from '@/lib/auth-context';
import { Login } from '@/components/login';

export default function RoomPage() {
  const params = useParams();
  const { user, loading } = useAuth();
  const roomId = params.roomId as string;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <WatchTogetherRoom roomId={roomId} />;
}
