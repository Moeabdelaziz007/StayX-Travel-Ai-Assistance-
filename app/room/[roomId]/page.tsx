'use client';

import { useParams } from 'next/navigation';
import { WatchTogetherRoom } from '@/components/watch-room/WatchTogetherRoom';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      <WatchTogetherRoom roomId={roomId} />
    </div>
  );
}
