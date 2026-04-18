import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bookmark, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface BookmarkData {
  id: string;
  timestamp: number;
  comment: string;
  userId: string;
  userName: string;
  color: string;
}

interface SyncedPlayerProps {
  roomId: string;
  videoId: string;
  isHost: boolean;
  onVideoEnd?: () => void;
}

export function SyncedPlayer({ roomId, videoId, isHost, onVideoEnd }: SyncedPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const lastSyncTime = useRef(0);
  const isUpdatingFromRemote = useRef(false);

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      if (onVideoEnd) onVideoEnd();
      return;
    }

    if (!isHost || isUpdatingFromRemote.current || !playerRef.current) return;

    const isPlaying = event.data === window.YT.PlayerState.PLAYING;
    const currentTimeAtEvent = playerRef.current.getCurrentTime();

    updateDoc(doc(db, 'rooms', roomId), {
      isPlaying,
      currentTime: currentTimeAtEvent
    }).catch(console.error);
  }, [isHost, roomId, onVideoEnd]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    }

    function initPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: isHost ? 1 : 0,
          disablekb: isHost ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            setDuration(event.target.getDuration());
          },
          onStateChange: onPlayerStateChange,
        },
      });
    }

    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
  }, [videoId, isHost, onPlayerStateChange]);

  useEffect(() => {
    if (isReady && playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId, isReady]);

  // Sync Remote -> Local
  useEffect(() => {
    if (!isReady) return;
    const roomRef = doc(db, 'rooms', roomId);
    return onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists() || isHost) return;
      const data = docSnap.data();
      isUpdatingFromRemote.current = true;
      const remoteTime = data.currentTime;
      if (Math.abs(playerRef.current.getCurrentTime() - remoteTime) > 2) {
        playerRef.current.seekTo(remoteTime, true);
      }
      if (data.isPlaying && playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      } else if (!data.isPlaying && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }
      setTimeout(() => { isUpdatingFromRemote.current = false; }, 500);
    });
  }, [roomId, isReady, isHost]);

  // Host Sync Loop & Progress Tracking
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      if (!playerRef.current?.getCurrentTime) return;
      const time = playerRef.current.getCurrentTime();
      setCurrentTime(time);
      if (isHost) {
        const isPlaying = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;
        if (Math.abs(time - lastSyncTime.current) > 1 || isPlaying) {
          updateDoc(doc(db, 'rooms', roomId), { currentTime: time, isPlaying }).catch(console.error);
          lastSyncTime.current = time;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isHost, isReady, roomId]);

  // Listen to Shared Bookmarks
  useEffect(() => {
    const q = query(collection(db, 'rooms', roomId, 'bookmarks'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setBookmarks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BookmarkData)));
    });
  }, [roomId]);

  const addBookmark = async (comment: string) => {
    if (!auth.currentUser || !playerRef.current) return;
    try {
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
      await addDoc(collection(db, 'rooms', roomId, 'bookmarks'), {
        timestamp: playerRef.current.getCurrentTime(),
        comment,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Traveler',
        color: colors[Math.floor(Math.random() * colors.length)],
        createdAt: serverTimestamp()
      });
      toast.success("Bookmark added!");
    } catch (e) {
      toast.error("Failed to add bookmark");
    }
  };

  return (
    <div className="w-full h-full relative group flex flex-col">
      <div className="flex-1 relative bg-black">
        {!isHost && <div className="absolute inset-0 z-10" />}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Shared Progress Bar Overlay (Client-side visual only) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 group-hover:h-3 transition-all">
        <div 
          className="h-full bg-emerald-500 relative" 
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
        </div>
        
        {/* Bookmark Dots */}
        {bookmarks.map((bm) => (
          <Popover key={bm.id}>
            <PopoverTrigger asChild>
              <button
                className="absolute top-0 w-2 h-full cursor-pointer hover:scale-150 transition-transform"
                style={{ 
                  left: `${(bm.timestamp / (duration || 1)) * 100}%`,
                  backgroundColor: bm.color
                }}
              />
            </PopoverTrigger>
            <PopoverContent side="top" className="w-48 bg-zinc-900 border-zinc-800 text-xs p-2">
              <p className="font-bold text-emerald-400 mb-1">{bm.userName}</p>
              <p className="text-zinc-300">{bm.comment}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 mt-2 w-full text-[10px]"
                onClick={() => playerRef.current.seekTo(bm.timestamp, true)}
              >
                Jump to {Math.floor(bm.timestamp / 60)}:{(Math.floor(bm.timestamp % 60)).toString().padStart(2, '0')}
              </Button>
            </PopoverContent>
          </Popover>
        ))}
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="secondary" className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-zinc-900 border-zinc-800 p-2">
            <p className="text-xs font-bold text-white mb-2">Add Shared Bookmark</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as any).comment;
              if (input.value.trim()) {
                addBookmark(input.value);
                input.value = '';
              }
            }}>
              <input 
                name="comment"
                placeholder="Important moment..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
              />
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
