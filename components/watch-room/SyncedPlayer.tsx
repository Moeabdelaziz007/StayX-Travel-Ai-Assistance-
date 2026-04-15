'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface SyncedPlayerProps {
  roomId: string;
  videoId: string;
  isHost: boolean;
}

export function SyncedPlayer({ roomId, videoId, isHost }: SyncedPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const lastSyncTime = useRef(0);
  const isUpdatingFromRemote = useRef(false);

  const onPlayerStateChange = useCallback((event: any) => {
    if (!isHost || isUpdatingFromRemote.current || !playerRef.current) return;

    const isPlaying = event.data === window.YT.PlayerState.PLAYING;
    const currentTime = playerRef.current.getCurrentTime();

    updateDoc(doc(db, 'rooms', roomId), {
      isPlaying,
      currentTime
    }).catch(console.error);
  }, [isHost, roomId]);

  useEffect(() => {
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    }

    function initPlayer() {
      if (!containerRef.current) return;
      
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: isHost ? 1 : 0, // Only host gets controls
          disablekb: isHost ? 0 : 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: onPlayerStateChange,
        },
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, isHost, onPlayerStateChange]);

  // Handle videoId changes
  useEffect(() => {
    if (isReady && playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId, isReady]);

  // Sync logic
  useEffect(() => {
    if (!isReady) return;

    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists() || isHost) return; // Host drives, doesn't listen to remote state (mostly)

      const data = docSnap.data();
      isUpdatingFromRemote.current = true;

      const currentTime = playerRef.current.getCurrentTime();
      const remoteTime = data.currentTime;
      
      // If time difference is > 2 seconds, seek
      if (Math.abs(currentTime - remoteTime) > 2) {
        playerRef.current.seekTo(remoteTime, true);
      }

      if (data.isPlaying && playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      } else if (!data.isPlaying && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }

      setTimeout(() => {
        isUpdatingFromRemote.current = false;
      }, 500);
    });

    return () => unsubscribe();
  }, [roomId, isReady, isHost]);

  // Host sync loop
  useEffect(() => {
    if (!isHost || !isReady) return;

    const syncInterval = setInterval(() => {
      if (!playerRef.current || !playerRef.current.getCurrentTime) return;
      
      const currentTime = playerRef.current.getCurrentTime();
      const isPlaying = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;
      
      // Only update if time changed significantly or state changed
      if (Math.abs(currentTime - lastSyncTime.current) > 1 || isPlaying) {
        updateDoc(doc(db, 'rooms', roomId), {
          currentTime,
          isPlaying
        }).catch(console.error);
        lastSyncTime.current = currentTime;
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [isHost, isReady, roomId]);

  return (
    <div className="w-full h-full relative pointer-events-none">
      {/* Overlay to prevent non-hosts from clicking */}
      {!isHost && <div className="absolute inset-0 z-10" />}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
