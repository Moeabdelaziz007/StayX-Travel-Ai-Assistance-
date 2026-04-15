'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SyncedPlayerProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  isHost: boolean;
  onStateChange: (state: { isPlaying: boolean; currentTime: number }) => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export function SyncedPlayer({ videoId, isPlaying, currentTime, isHost, onStateChange }: SyncedPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    function initPlayer() {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          controls: isHost ? 1 : 0, // Only host has controls
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: (event: any) => {
            if (isHost) {
              const playerState = event.data;
              const playing = playerState === window.YT.PlayerState.PLAYING;
              const time = playerRef.current.getCurrentTime();
              onStateChange({ isPlaying: playing, currentTime: time });
            }
          },
        },
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [isHost, onStateChange, videoId]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    // Sync state from props (for non-hosts)
    if (!isHost) {
      const playerState = playerRef.current.getPlayerState();
      const currentPlaying = playerState === window.YT.PlayerState.PLAYING;
      const playerTime = playerRef.current.getCurrentTime();

      if (isPlaying && !currentPlaying) {
        playerRef.current.playVideo();
      } else if (!isPlaying && currentPlaying) {
        playerRef.current.pauseVideo();
      }

      // Drift tolerance: 2 seconds
      if (Math.abs(playerTime - currentTime) > 2) {
        playerRef.current.seekTo(currentTime, true);
      }
    }
  }, [isReady, isPlaying, currentTime, isHost]);

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
      <div id="youtube-player" className="w-full h-full" />
    </div>
  );
}
