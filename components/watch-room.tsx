'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play, Heart, Sparkles, Tv, Volume2, Settings, Youtube } from 'lucide-react';
import { db, auth, loginWithYoutube } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { toggleFavorite } from '@/lib/travel-tools';
import { toast } from 'sonner';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { WatchRoomSidebar } from './watch-room/WatchRoomSidebar';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Users } from 'lucide-react';

export function WatchRoom() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');
  const [currentVideoTitle, setCurrentVideoTitle] = useState('World Travel Guide');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isTvOn, setIsTvOn] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, 'trips'), where('userId', '==', auth.currentUser.uid), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const trip = snap.docs[0].data();
          setSuggestions([
            { id: 'v1', title: `Top 10 Things to do in ${trip.destination}`, videoId: 'dQw4w9WgXcQ', thumbnail: `https://picsum.photos/seed/${trip.destination}1/400/225` },
            { id: 'v2', title: `${trip.destination} Travel Guide 2026`, videoId: 'dQw4w9WgXcQ', thumbnail: `https://picsum.photos/seed/${trip.destination}2/400/225` },
            { id: 'v3', title: `Hidden Gems in ${trip.destination}`, videoId: 'dQw4w9WgXcQ', thumbnail: `https://picsum.photos/seed/${trip.destination}3/400/225` },
            { id: 'v4', title: `Best Street Food in ${trip.destination}`, videoId: 'dQw4w9WgXcQ', thumbnail: `https://picsum.photos/seed/${trip.destination}4/400/225` },
          ]);
        } else {
          setSuggestions([
            { id: 'v1', title: "World's Most Beautiful Places", videoId: 'dQw4w9WgXcQ', thumbnail: 'https://picsum.photos/seed/travel1/400/225' },
            { id: 'v2', title: "Luxury Travel on a Budget", videoId: 'dQw4w9WgXcQ', thumbnail: 'https://picsum.photos/seed/travel2/400/225' },
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSuggestions();
  }, []);

  const handleSearch = () => {
    const match = searchQuery.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (match && match[1]) {
      setVideoId(match[1]);
      setCurrentVideoTitle('Custom Travel Video');
      setIsTvOn(true);
    } else if (searchQuery.trim()) {
      // If not a URL, we could potentially search, but for now just show a placeholder or toast
      toast.info("Searching for: " + searchQuery);
    }
  };

  const handleFavorite = async (video: any) => {
    try {
      await toggleFavorite({
        itemId: video.videoId || videoId,
        type: 'video',
        title: video.title || 'YouTube Video',
        thumbnail: video.thumbnail
      });
      toast.success("Added to favorites!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleYoutubeLogin = async () => {
    try {
      await loginWithYoutube();
      toast.success("YouTube account connected!");
    } catch (e) {
      toast.error("Failed to connect YouTube");
    }
  };

  const createRoom = async () => {
    if (!auth.currentUser) {
      toast.error("Please log in to create a room");
      return;
    }
    const roomId = nanoid(10);
    try {
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            <Tv className="h-10 w-10 text-emerald-500" />
            STAY<span className="text-emerald-500">TV</span>
          </h1>
          <p className="text-zinc-500 font-medium">{language === 'ar' ? 'مركز الترفيه الخاص بالسفر.' : 'Your personal travel entertainment hub.'}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={createRoom}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
          >
            <Users className="h-4 w-4" /> {t('nav.watch')}
          </Button>
          <Button 
            variant="outline" 
            className="border-zinc-800 bg-zinc-900/40 backdrop-blur-md text-zinc-400 hover:text-white rounded-full gap-2"
            onClick={handleYoutubeLogin}
          >
            <Youtube className="h-4 w-4 text-rose-500" /> Connect YouTube
          </Button>
          <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-full border border-zinc-800">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-zinc-500 hover:text-white">
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-zinc-500 hover:text-white">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* TV Main Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative group">
            {/* TV Frame */}
            <div className="absolute -inset-4 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-t border-zinc-600" />
            
            <Card className="relative z-10 border-8 border-zinc-950 bg-black overflow-hidden rounded-[2.5rem] aspect-video shadow-inner">
              <AnimatePresence mode="wait">
                {isTvOn ? (
                  <motion.div 
                    key="tv-on"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full relative"
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                    
                    {/* Overlay Controls */}
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="bg-black/60 backdrop-blur-md rounded-full hover:bg-red-600 transition-colors"
                        onClick={() => handleFavorite({ videoId, title: 'Current Video' })}
                      >
                        <Heart className="h-5 w-5 text-white" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="bg-black/60 backdrop-blur-md rounded-full hover:bg-zinc-800"
                        onClick={() => setIsTvOn(false)}
                      >
                        <Play className="h-5 w-5 text-white rotate-180" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="tv-off"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center bg-zinc-950"
                  >
                    <div className="h-1 w-32 bg-zinc-800 rounded-full mb-4 animate-pulse" />
                    <Button 
                      onClick={() => setIsTvOn(true)}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-8 gap-2 border border-zinc-800"
                    >
                      <Play className="h-4 w-4 fill-current" /> Power On
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* TV Stand/Base Shadow */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-black/40 blur-xl rounded-full" />
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/50 backdrop-blur-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <Input 
                placeholder={t('watch.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-14 border-none bg-transparent text-white text-lg focus-visible:ring-0"
              />
            </div>
            <Button onClick={handleSearch} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all">
              {t('watch.search')}
            </Button>
          </div>
        </div>

        {/* Sidebar Suggestions & Insights */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Insights Sidebar */}
          {isTvOn && (
            <div className="h-[400px] lg:h-auto lg:flex-1 min-h-[300px]">
              <WatchRoomSidebar videoTitle={currentVideoTitle} />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-500">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-widest text-sm">{t('watch.up_next')}</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white text-xs">Refresh</Button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[400px] lg:flex-1">
            {suggestions.map(video => (
              <motion.div
                key={video.id}
                whileHover={{ x: 5 }}
                className="group cursor-pointer"
                onClick={() => {
                  setVideoId(video.videoId);
                  setCurrentVideoTitle(video.title);
                  setIsTvOn(true);
                }}
              >
                <Card className="border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm overflow-hidden hover:bg-zinc-900/40 transition-all rounded-2xl">
                  <CardContent className="p-0 flex flex-col">
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image 
                        src={video.thumbnail} 
                        alt={video.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-10 w-10 text-white fill-current" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white">
                        12:45
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-500 transition-colors">
                        {video.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 font-medium">Travel Guide • 245K views</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 rounded-full hover:bg-emerald-500/10 hover:text-emerald-500"
                          onClick={(e) => { e.stopPropagation(); handleFavorite(video); }}
                        >
                          <Heart className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
