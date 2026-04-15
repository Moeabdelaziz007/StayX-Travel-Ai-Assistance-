'use client';

import { motion } from 'motion/react';
import { WeatherWidget } from './weather-widget';
import { Compass, ArrowUpRight, Calendar, Mic, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { createVoiceRoom } from '@/lib/travel-tools';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';

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
      <header className="flex flex-col gap-4">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-bold tracking-tight text-white"
          >
            {t('home.welcome_name').replace('{name}', user?.displayName?.split(' ')[0] || 'Traveler')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg"
          >
            {t('home.where_to')}
          </motion.p>
        </div>
      </header>

      {tripsCount === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 flex flex-col gap-6"
        >
          <h2 className="text-3xl font-bold text-white">Welcome to StayX! Where are you heading?</h2>
          <div className="flex flex-wrap gap-3">
            {destinations.map((dest) => (
              <Button
                key={dest.id}
                variant="outline"
                className={`rounded-full border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition-all gap-2 px-6 h-12`}
                onClick={() => handleDestinationClick(dest.id)}
              >
                <MapPin className={`h-4 w-4 ${dest.color.split(' ')[1]}`} />
                {dest.name}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Weather - Large Span */}
        <div className="md:col-span-2 lg:col-span-2">
          <WeatherWidget location="Paris, France" />
        </div>

        {/* Voice Room Creation */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="md:col-span-1 lg:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 hover:bg-zinc-900/60 transition-all"
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
          className="md:col-span-1 lg:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 hover:bg-zinc-900/60 transition-all"
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
    </div>
  );
}
