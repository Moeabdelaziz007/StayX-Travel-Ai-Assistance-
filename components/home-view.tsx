'use client';

import { motion } from 'motion/react';
import { WeatherWidget } from './weather-widget';
import { Compass, ArrowUpRight, Calendar, Mic, MapPin, Sparkles, Languages } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { createVoiceRoom } from '@/lib/travel-tools';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { CurrencyWidget } from './CurrencyWidget';
import { VisaWidget } from './VisaWidget';
import { MoodBoard } from './travel/MoodBoard';
import { ArabicTravelers } from './travel/ArabicTravelers';

export function HomeView({ onNavigate, tripsCount }: { onNavigate: (tab: string) => void, tripsCount: number }) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [roomTitle, setRoomTitle] = useState('');
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const destinations = [
    { name: t('home.dest.dubai'), id: 'dubai', color: 'bg-orange-500/20 text-orange-500' },
    { name: t('home.dest.paris'), id: 'paris', color: 'bg-blue-500/20 text-blue-500' },
    { name: t('home.dest.istanbul'), id: 'istanbul', color: 'bg-red-500/20 text-red-500' },
    { name: t('home.dest.bangkok'), id: 'bangkok', color: 'bg-green-500/20 text-green-500' },
  ];

  const handleDestinationClick = (id: string) => {
    // This is a bit tricky as we need to trigger search in SearchCompareView.
    // For now, navigate to search and let user know.
    onNavigate('search');
    toast.info(`Searching for ${id}...`);
  };

  const handleCreateRoom = async () => {
    if (!roomTitle) {
      toast.error("Please enter a room title");
      return;
    }
    try {
      const res = await createVoiceRoom({ title: roomTitle });
      setMagicLink(res.magicLink);
      toast.success("Voice room created!");
    } catch (e) {
      toast.error("Failed to create room");
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section with Intense Visuals */}
      <section className="relative -mt-4 -mx-4 md:-mt-6 md:-mx-6 mb-12 h-[600px] flex items-center justify-center overflow-hidden rounded-b-[4rem] shadow-2xl">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover"
            src="https://cdn.pixabay.com/video/2019/11/14/29169-373809075_large.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/20" />
        </div>
        
        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="space-y-6"
          >
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md">
              <Sparkles className="w-3 h-3 mr-2" /> Next-Gen AI Travel
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
              {language === 'ar' ? 'رحلتك، بصوتك.' : 'Your Trip, Your Voice.'}
            </h1>
            <p className="text-lg md:text-2xl text-zinc-300 font-medium max-w-2xl mx-auto opacity-80 leading-relaxed">
              Experience the world with StayX – the first AI travel assistant built for the modern voyager.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-full max-w-3xl mt-12 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-full p-2 shadow-2xl">
              <MapPin className="ml-4 h-6 w-6 text-emerald-400" />
              <Input 
                placeholder={language === 'ar' ? 'إلى أين؟ (مثلاً: طوكيو، باريس)' : "Where to? (e.g., Paris, Tokyo, Dubai)"}
                className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-zinc-500 h-14 focus-visible:ring-0 px-4"
              />
              <Button size="lg" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black px-10 h-12 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                {language === 'ar' ? 'اكتشف' : 'Explore'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Trending Destinations */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Compass className="h-8 w-8 text-emerald-500" /> {language === 'ar' ? 'وجهات رائجة' : 'Trending Now'}
            </h2>
            <p className="text-zinc-500 text-sm font-medium">Curated destinations based on your mood.</p>
          </div>
          <Button variant="ghost" className="text-emerald-500 font-bold gap-2">
            View All <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px]">
          {destinations.map((dest, i) => (
            <motion.div
              key={dest.id}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              onClick={() => handleDestinationClick(dest.id)}
              className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-2xl ${
                i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
              } ${i === 3 ? 'lg:col-span-2' : ''}`}
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:from-emerald-950/90 transition-all duration-700" />
              <motion.img 
                src={`https://image.pollinations.ai/prompt/${dest.id}%20high%20fashion%20travel%20landmark%20cinematic%20lighting?width=1000&height=1000&nologo=true`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt={dest.name}
              />
              <div className="absolute top-6 right-6 z-20">
                <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-500 rotate-45 group-hover:rotate-0">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-3 inline-block ${dest.color} backdrop-blur-md`}>
                  Top Rated
                </span>
                <p className="text-white font-black text-3xl tracking-tight leading-none mb-2">{dest.name}</p>
                <p className="text-zinc-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 line-clamp-1">
                  Discover the hidden gems of {dest.name}...
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Weather - Large Span */}
        <div className="md:col-span-4 lg:col-span-2">
          <WeatherWidget location="Paris, France" />
        </div>

        {/* AI Services Bento */}
        <div className="md:col-span-2 space-y-8">
           <motion.div 
            whileHover={{ y: -5 }}
            className="group h-full relative overflow-hidden rounded-[3rem] border border-emerald-500/20 bg-zinc-900/40 backdrop-blur-2xl p-8 hover:bg-emerald-500/5 transition-all cursor-pointer"
            onClick={() => onNavigate('planner-pro')}
          >
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white tracking-tight">Planner Pro</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">Hyper-detailed itineraries with AI logic.</p>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between text-emerald-500 font-black text-xs uppercase tracking-widest">
                <span>Start Planning</span> <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="md:col-span-2 space-y-8">
           {/* Visa Widget */}
          <VisaWidget />
        </div>

        <div className="md:col-span-4 lg:col-span-2">
           <CurrencyWidget defaultTarget="EUR" />
        </div>

        {/* SmartGet Hero Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-4 group relative rounded-[3.5rem] overflow-hidden border border-white/5 bg-zinc-900/40 backdrop-blur-3xl cursor-pointer"
          onClick={() => onNavigate('search')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
          <div className="relative p-10 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <div className="h-16 w-16 rounded-[1.5rem] bg-zinc-950 flex items-center justify-center text-emerald-500 border border-white/5 shadow-2xl">
                <Compass className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-black text-white tracking-tighter leading-none">SmartGet Search</h3>
                <p className="text-zinc-400 text-xl font-medium max-w-xl">
                  One search, all results. Compare prices from Airbnb, Booking.com and major airlines instantly.
                </p>
              </div>
              <div className="flex gap-3">
                <Badge className="bg-zinc-800/80 text-zinc-400 border-zinc-700/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest">Global Coverage</Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2 text-[10px] font-black uppercase tracking-widest">Best Price Guarantee</Badge>
              </div>
            </div>
            <div className="relative w-full md:w-[400px] aspect-square rounded-[2rem] overflow-hidden border border-white/10 rotate-3 group-hover:rotate-0 transition-transform duration-700 shadow-2xl">
               <Image 
                src="https://picsum.photos/seed/travel-search/800/800"
                alt="SmartGet"
                fill
                className="object-cover opacity-80"
                referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
               <div className="absolute bottom-6 left-6 right-6">
                 <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                   <p className="text-white text-xs font-bold">Latest Discovery</p>
                   <p className="text-zinc-400 text-[10px]">Flights to Bali starting at $450</p>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white tracking-tight">{language === 'ar' ? 'لوحة المزاج' : 'Travel Mood Board'}</h2>
          <p className="text-zinc-500 text-sm font-medium">Visual inspiration for your wanderlust.</p>
        </div>
        <MoodBoard destination="Dubai" />
      </div>

      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white tracking-tight">{language === 'ar' ? 'صناع المحتوى العرب' : 'Arabic Travel Creators'}</h2>
          <p className="text-zinc-500 text-sm font-medium">Get insights from the best in the region.</p>
        </div>
        <ArabicTravelers />
      </div>
    </div>
  );
}
