'use client';

import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SyncedPlayer } from './SyncedPlayer';
import { RoomChat } from './RoomChat';
import { WatchRoomSidebar } from './WatchRoomSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Share2, Crown, LogOut, MapPin, Plane, Cloud, Thermometer, MonitorPlay } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import NextImage from 'next/image';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchFlights, getWeather } from '@/lib/travel-tools';

const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

interface RoomData {
  hostUid: string;
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  participants: Record<string, boolean>;
  createdAt: any;
}

export function WatchTogetherRoom({ roomId }: { roomId: string }) {
  const { t, language } = useI18n();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [destination, setDestination] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [tripPlan, setTripPlan] = useState<any>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const router = useRouter();

  const planTrip = async (title: string) => {
    setIsLoadingPlan(true);
    try {
      // 1. Detect destination
      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const destRes = await model.generateContent(`Extract destination from: "${title}". Return only the city name.`);
      const dest = destRes.text?.trim() || 'Paris';
      
      // 2. Fetch data
      const [flights, weather] = await Promise.all([
        searchFlights({ origin: 'Cairo', destination: dest, date: '2025-05-01' }),
        getWeather({ location: dest })
      ]);
      
      setTripPlan({ destination: dest, flights, weather });
    } catch (e) {
      console.error(e);
      toast.error("Failed to plan trip");
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const searchVideos = async (dest: string) => {
    setIsLoadingVideos(true);
    try {
      const res = await fetch(`/api/youtube/search?destination=${encodeURIComponent(dest)}`);
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to search videos");
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleVideoSelect = async (videoId: string) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        videoId: videoId,
        currentTime: 0,
        isPlaying: true
      });
    } catch (error) {
      console.error("Error changing video:", error);
      toast.error("Failed to change video");
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      toast.error("Please log in to join a room");
      router.push('/');
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);

    const initRoom = async () => {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        // Create room if it doesn't exist
        await setDoc(roomRef, {
          hostUid: auth.currentUser!.uid,
          videoId: 'dQw4w9WgXcQ', // Default video
          currentTime: 0,
          isPlaying: false,
          participants: {
            [auth.currentUser!.uid]: true
          },
          createdAt: serverTimestamp()
        });
        setIsHost(true);
      } else {
        const data = roomSnap.data() as RoomData;
        setIsHost(data.hostUid === auth.currentUser!.uid);
        // Add self to participants
        await updateDoc(roomRef, {
          [`participants.${auth.currentUser!.uid}`]: true
        });
      }
    };

    initRoom();

    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoomData(doc.data() as RoomData);
      } else {
        toast.error("Room closed by host");
        router.push('/dashboard');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}`);
    });

    return () => {
      unsubscribe();
      // Remove self from participants on unmount
      if (auth.currentUser) {
        updateDoc(roomRef, {
          [`participants.${auth.currentUser.uid}`]: false
        }).catch(console.error);
      }
    };
  }, [roomId, router]);

  const handleLeaveRoom = () => {
    router.push('/dashboard');
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  if (!roomData) {
    return <div className="flex items-center justify-center h-full text-white">{language === 'ar' ? 'جاري الانضمام للغرفة...' : 'Joining room...'}</div>;
  }

  const activeParticipantsCount = Object.values(roomData.participants || {}).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className={`flex items-center justify-between p-4 border-b border-zinc-800 ${cinemaMode ? 'bg-black/80 backdrop-blur-md' : 'bg-zinc-900/50'} z-50 relative transition-all duration-700`}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-500">STAY</span>TV {language === 'ar' ? 'حفلة مشاهدة' : 'Watch Party'}
          </h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium">
            <Users className="h-3 w-3 text-emerald-500" />
            {activeParticipantsCount} {language === 'ar' ? 'مشاركين' : 'watching'}
          </div>
          {isHost && (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 uppercase tracking-wider">
              <Crown className="h-3 w-3" /> {language === 'ar' ? 'المضيف' : 'Host'}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isHost && (
            <div className="flex gap-2 mr-4">
              <Input 
                placeholder={language === 'ar' ? 'وجهة السفر...' : 'Travel destination...'}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchVideos(destination)}
                className="h-8 w-48 bg-zinc-900 border-zinc-700 text-xs"
              />
              <Button size="sm" onClick={() => searchVideos(destination)} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                {language === 'ar' ? 'بحث' : 'Search'}
              </Button>
            </div>
          )}
          <Button 
            size="sm" 
            variant={cinemaMode ? "default" : "outline"}
            onClick={() => setCinemaMode(!cinemaMode)} 
            className={`gap-2 ${cinemaMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' : 'border-zinc-700 hover:bg-zinc-800'}`}
          >
            <MonitorPlay className="h-4 w-4" /> {cinemaMode ? 'Exit Cinema' : 'Cinema Mode'}
          </Button>
          <Button size="sm" variant="outline" onClick={copyInviteLink} className="border-zinc-700 hover:bg-zinc-800 gap-2">
            <Share2 className="h-4 w-4" /> {language === 'ar' ? 'مشاركة' : 'Share'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLeaveRoom} className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2">
            <LogOut className="h-4 w-4" /> {language === 'ar' ? 'مغادرة' : 'Leave'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 flex overflow-hidden transition-colors duration-1000 ${cinemaMode ? 'bg-black' : ''}`}>
        {/* Cinematic Backdrop mapping */}
        {cinemaMode && (
          <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
            <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}

        {/* Left Side: Video & Insights */}
        <div className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar z-10 transition-all duration-700 ${cinemaMode ? 'px-12 py-8' : ''}`}>
          <div className={`flex-1 flex flex-col ${cinemaMode ? 'gap-12 max-w-7xl mx-auto w-full' : 'gap-6 p-4 lg:p-6'}`}>
            {/* Video Player */}
            <div className={`w-full bg-black rounded-2xl overflow-hidden border shadow-2xl transition-all duration-700 ${cinemaMode ? 'aspect-[21/9] border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.15)] scale-100' : 'aspect-video border-zinc-800'}`}>
              <SyncedPlayer 
                roomId={roomId} 
                videoId={roomData.videoId} 
                isHost={isHost} 
              />
            </div>

            {/* Video Grid */}
            <div className={`transition-opacity duration-700 ${cinemaMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
              {videos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <div key={video.videoId} className="cursor-pointer group" onClick={() => { handleVideoSelect(video.videoId); planTrip(video.title); }}>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                        <NextImage src={video.thumbnail} alt={video.title} fill className="object-cover" unoptimized />
                      </div>
                      <h4 className="text-xs text-zinc-300 mt-2 truncate group-hover:text-emerald-400">{video.title}</h4>
                    </div>
                  ))}
                </div>
              )}

              {/* Plan This Trip Panel */}
              {tripPlan && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Plan your trip to {tripPlan.destination}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-xl">
                      <p className="text-xs text-zinc-500">Weather</p>
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Cloud className="h-4 w-4 text-blue-400" /> {tripPlan.weather.temperature}°C
                      </div>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-xl">
                      <p className="text-xs text-zinc-500">Cheapest Flight</p>
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Plane className="h-4 w-4 text-emerald-400" /> {tripPlan.flights[0].price}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Create Full Itinerary</Button>
                </div>
              )}
              
              {/* Insights Sidebar */}
              <div className="flex-1 min-h-[300px] mt-6">
                <WatchRoomSidebar videoTitle="Current Watch Party Video" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Chat */}
        <div className={`shrink-0 border-l border-zinc-800 transition-all duration-700 z-10 ${cinemaMode ? 'w-0 opacity-0 overflow-hidden border-none' : 'w-80 lg:w-96 bg-zinc-900/30 opacity-100'}`}>
          <div className="w-80 lg:w-96 h-full">
            <RoomChat roomId={roomId} />
          </div>
        </div>
      </div>
    </div>
  );
}
