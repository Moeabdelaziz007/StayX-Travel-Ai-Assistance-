'use client';

import { motion } from 'motion/react';
import { WeatherWidget } from './weather-widget';
import { Compass, ArrowUpRight, Calendar, Mic, MapPin, Sparkles } from 'lucide-react';
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
    <div className="space-y-8 pb-12">
      {/* Hero Section with Video Background */}
      <section className="relative -mt-4 -mx-4 md:-mt-6 md:-mx-6 mb-12 h-[500px] flex items-center justify-center overflow-hidden rounded-b-[3rem]">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover opacity-60"
            src="https://cdn.pixabay.com/video/2019/11/14/29169-373809075_large.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/60" />
        </div>
        
        <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-xl">
              {t('home.welcome_name').replace('{name}', user?.displayName?.split(' ')[0] || 'Traveler')}
            </h1>
            <p className="text-xl md:text-2xl text-zinc-200 font-medium drop-shadow-md">
              Discover your next great adventure.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full relative group"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all duration-500" />
            <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-full p-2 shadow-2xl">
              <MapPin className="ml-4 h-6 w-6 text-emerald-400" />
              <Input 
                placeholder="Where to? (e.g., Paris, Tokyo, Dubai)"
                className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-zinc-400 h-14 focus-visible:ring-0 px-4"
              />
              <Button size="lg" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 h-12 shadow-lg shadow-emerald-500/20">
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Destinations with Parallax effect */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-400" /> Trending Destinations
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {destinations.map((dest, i) => (
            <motion.div
              key={dest.id}
              whileHover={{ y: -8, scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              onClick={() => handleDestinationClick(dest.id)}
              className="relative h-64 rounded-3xl overflow-hidden cursor-pointer group"
            >
              <motion.img 
                src={`https://image.pollinations.ai/prompt/${dest.id}%20beautiful%20landmark%20travel%20scenic?width=600&height=800&nologo=true`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt={dest.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="text-white font-black text-2xl tracking-wide">{dest.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase tracking-wider">Explore</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Weather - Large Span */}
        <div className="md:col-span-3 lg:col-span-2 flex flex-col">
          <WeatherWidget location="Paris, France" />
        </div>

        {/* Currency Widget */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="md:col-span-3 lg:col-span-2 group relative h-full flex flex-col"
        >
          <CurrencyWidget defaultTarget="EUR" />
        </motion.div>

        {/* Visa Widget */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="md:col-span-3 lg:col-span-2 group relative h-full flex flex-col"
        >
          <VisaWidget />
        </motion.div>

        {/* AI Planner Pro Promo */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="md:col-span-3 lg:col-span-2 group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-6 hover:bg-emerald-500/20 transition-all cursor-pointer"
          onClick={() => onNavigate('planner-pro')}
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">AI Planner Pro</h3>
              <p className="text-zinc-400 text-sm">Generate detailed itineraries with AI images and PDF export.</p>
            </div>
            <div className="mt-4 flex items-center text-emerald-500 font-bold text-sm">
              Try Now <ArrowUpRight className="ml-2 h-4 w-4" />
            </div>
          </div>
        </motion.div>

        {/* Voice Room Creation */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="md:col-span-3 lg:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 hover:bg-zinc-900/60 transition-all"
        >
          <div className="flex flex-col gap-4 h-full">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Mic className="h-5 w-5 text-emerald-500" />
              {language === 'ar' ? 'إنشاء غرفة صوتية' : 'Create Voice Room'}
            </h3>
            <div className="flex gap-2">
              <Input 
                placeholder={language === 'ar' ? 'عنوان الغرفة' : 'Room Title'} 
                value={roomTitle} 
                onChange={(e) => setRoomTitle(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
              />
              <Button onClick={handleCreateRoom} className="bg-emerald-600 hover:bg-emerald-700 text-white">{language === 'ar' ? 'إنشاء' : 'Create'}</Button>
            </div>
            {magicLink && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 rounded-xl bg-zinc-950 border border-green-500/30 space-y-2"
              >
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invite Magic Link</p>
                <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <code className="text-xs text-green-400 truncate flex-1">{magicLink}</code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs border-zinc-700 hover:bg-zinc-800"
                    onClick={() => {
                      navigator.clipboard.writeText(magicLink);
                      toast.success("Link copied!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Creative Calendar - Recipe 9 Style */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="md:col-span-3 lg:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 hover:bg-zinc-900/60 transition-all"
        >
          <div className="absolute top-0 right-0 p-4">
            <Calendar className="h-6 w-6 text-emerald-500 opacity-20" />
          </div>
          <div className="flex gap-6 h-full">
            <div className="flex flex-col items-center justify-center border-r border-zinc-800 pr-6">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 mb-4">APRIL</span>
              <span className="text-7xl font-black text-white leading-none">14</span>
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">Upcoming Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">Flight to Tokyo</p>
                    <p className="text-[10px] text-zinc-500">10:30 AM • Terminal 3</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">Hotel Check-in</p>
                    <p className="text-[10px] text-zinc-500">02:00 PM • Park Hyatt</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" className="w-full text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-white" onClick={() => onNavigate('calendar')}>
                View Full Calendar
              </Button>
            </div>
          </div>
        </motion.div>

        {/* SmartGet Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="md:col-span-3 lg:col-span-4 group relative"
        >
          <Card className="h-full border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl overflow-hidden rounded-[2rem] cursor-pointer hover:bg-zinc-900/60 transition-all" onClick={() => onNavigate('search')}>
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">SmartGet</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Real-time price comparison engine. Scan Airbnb, Booking.com, and airlines for the best deals.
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">Airbnb</Badge>
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">Expedia</Badge>
                </div>
                <ArrowUpRight className="h-6 w-6 text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Travel Mood Board</h2>
        <MoodBoard destination="Dubai" />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Arabic Travel Creators</h2>
        <ArabicTravelers />
      </div>
    </div>
  );
}
