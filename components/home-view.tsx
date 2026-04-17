'use client';

import { motion } from 'motion/react';
import { WeatherWidget } from './weather-widget';
import { 
  Compass, 
  ArrowUpRight, 
  Calendar, 
  Sparkles, 
  MapPin, 
  Plus, 
  Users, 
  Plane, 
  Timer,
  LayoutDashboard,
  Search,
  MonitorPlay,
  Briefcase
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { CurrencyWidget } from './CurrencyWidget';
import { VisaWidget } from './VisaWidget';
import { MoodBoard } from './travel/MoodBoard';
import { ArabicTravelers } from './travel/ArabicTravelers';
import { ProgressTracker } from './ProgressTracker';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ErrorBoundary } from './ErrorBoundary';

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 space-y-1">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">{title}</h2>
        <div className="h-px flex-1 bg-zinc-800/50" />
      </div>
      <p className="text-zinc-500 text-sm font-medium">{description}</p>
    </div>
  );
}

function TripCountdown() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [nextTrip, setNextTrip] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number }>({ days: 0, hours: 0 });

  useEffect(() => {
    if (!user) return;
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'trips'),
      where('userId', '==', user.uid),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setNextTrip(snapshot.docs[0].data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'trips');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!nextTrip?.startDate) return;
    const timer = setInterval(() => {
      const target = new Date(nextTrip.startDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextTrip]);

  if (!nextTrip) return null;

  return (
    <Card className="relative overflow-hidden border-white/5 bg-zinc-900 group h-full rounded-2xl">
      <div className="absolute inset-0 z-0">
        <NextImage 
          src={`https://image.pollinations.ai/prompt/${nextTrip.destination}%20travel%20landmark%20cinematic%20lighting?width=800&height=400&nologo=true`}
          alt={nextTrip.destination}
          fill
          className="object-cover opacity-30 group-hover:scale-110 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>
      <CardContent className="relative z-10 p-6 flex flex-col justify-between h-full">
        <div className="space-y-1">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
            {t('home.countdown_title')}
          </Badge>
          <h3 className="text-2xl font-black text-white italic">{nextTrip.destination}</h3>
        </div>
        <div className="flex items-center gap-6 py-4">
          <div className="text-center">
            <span className="text-4xl font-black text-emerald-400 block tabular-nums">{timeLeft.days}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('home.countdown_days')}</span>
          </div>
          <div className="text-center">
            <span className="text-4xl font-black text-white block tabular-nums">{timeLeft.hours}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('home.countdown_hours')}</span>
          </div>
          <div className="flex-1 text-right flex flex-col items-end">
             <Timer className="h-8 w-8 text-zinc-800 mb-1" />
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter leading-none">
               {t('home.countdown_subtitle')}
             </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomeView({ onNavigate, tripsCount }: { onNavigate: (tab: string) => void, tripsCount: number }) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || t('home.traveler');

  const mainFeatures = [
    { id: 'search', icon: Search, label: t('home.quick_search'), color: 'emerald', desc: 'Flights & Hotels' },
    { id: 'planner-pro', icon: Sparkles, label: t('home.planner_pro'), color: 'blue', desc: 'AI Itineraries' },
    { id: 'watch', icon: MonitorPlay, label: t('home.stay_tv'), color: 'purple', desc: 'Travel Vlogs' },
    { id: 'nav.buddies', icon: Users, label: t('home.buddies'), color: 'orange', desc: 'Community' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-32">
      <section>
        <SectionHeader 
          title={t('home.section_welcome_title').replace('{name}', firstName)} 
          description={t('home.section_welcome_desc')} 
        />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 lg:col-span-4 h-[240px]">
            <ErrorBoundary name="Trip Countdown">
              <TripCountdown />
            </ErrorBoundary>
          </div>
          <div className="md:col-span-12 lg:col-span-8 h-[240px]">
            <ErrorBoundary name="Weather">
              <WeatherWidget location="Dubai, UAE" />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader 
          title={t('home.section_tools_title')} 
          description={t('home.section_tools_desc')} 
        />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {mainFeatures.map((feat) => (
              <motion.button
                key={feat.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(feat.id)}
                className="group relative flex flex-col items-center justify-center p-6 bg-zinc-900/40 border border-white/5 rounded-xl hover:border-emerald-500/20 transition-all text-center gap-3 overflow-hidden"
              >
                <div className={`h-12 w-12 rounded-lg bg-${feat.color}-500/10 flex items-center justify-center text-${feat.color}-500 border border-${feat.color}-500/20`}>
                  <feat.icon className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-white uppercase tracking-wider block">{feat.label}</span>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter block">{feat.desc}</span>
                </div>
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ArrowUpRight className="h-3 w-3 text-zinc-700" />
                </div>
              </motion.button>
            ))}
          </div>
          <div className="xl:col-span-4 bg-zinc-900/20 p-4 border border-zinc-800/50 rounded-2xl flex items-center justify-center min-h-[140px]">
             <div className="text-center space-y-3">
                <LayoutDashboard className="h-6 w-6 text-zinc-700 mx-auto" />
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic leading-none">Quick Access Center</p>
                <div className="flex gap-2">
                   <Button variant="ghost" size="icon" className="rounded-lg text-zinc-500 hover:text-white hover:bg-white/10" onClick={() => onNavigate('search')}>
                      <Search className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" className="rounded-lg text-zinc-500 hover:text-white hover:bg-white/10" onClick={() => onNavigate('watch')}>
                      <MonitorPlay className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" className="rounded-lg text-zinc-500 hover:text-white hover:bg-white/10" onClick={() => onNavigate('planner-pro')}>
                      <MapPin className="h-4 w-4" />
                   </Button>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title={t('home.section_plan_title')} description={t('home.section_plan_desc')} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-zinc-900/40 border-white/5 rounded-2xl h-full shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <ErrorBoundary name="Visa Widget">
                <VisaWidget />
              </ErrorBoundary>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/40 border-white/5 rounded-2xl h-full shadow-2xl">
            <CardContent className="p-6">
              <ErrorBoundary name="Currency Converter">
                <CurrencyWidget defaultTarget="EUR" />
              </ErrorBoundary>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/40 border-white/5 rounded-2xl lg:col-span-1 shadow-2xl">
            <CardContent className="p-6">
               <ErrorBoundary name="Progress Tracker">
                 <ProgressTracker steps={[
                   { label: 'Booking', completed: true },
                   { label: 'Visas', completed: false },
                   { label: 'Packing', completed: false },
                   { label: 'Check-in', completed: false },
                 ]} />
               </ErrorBoundary>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader title={t('home.section_explore_title')} description={t('home.section_explore_desc')} />
        <div className="space-y-12">
          <motion.div 
            whileHover={{ y: -5 }}
            className="group relative rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/40 backdrop-blur-3xl cursor-pointer"
            onClick={() => onNavigate('search')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="h-14 w-14 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-500 border border-white/5 shadow-2xl">
                  <Compass className="h-7 w-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-4xl font-black text-white tracking-tighter leading-none italic uppercase">SmartGet Search</h3>
                  <p className="text-zinc-400 text-lg font-medium max-w-xl">Compare prices from Airbnb, Booking.com and major airlines instantly.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Global Coverage</Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Best Price Guarantee</Badge>
                </div>
              </div>
              <div className="relative w-full md:w-[320px] aspect-video md:aspect-square rounded-xl overflow-hidden border border-white/10 transition-transform duration-700 shadow-2xl">
                 <NextImage 
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop"
                  alt="SmartGet"
                  fill
                  className="object-cover opacity-60"
                  referrerPolicy="no-referrer"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                 <div className="absolute bottom-4 left-4 right-4">
                   <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                     <p className="text-emerald-400 text-[10px] font-black uppercase">Live Deals</p>
                     <p className="text-white text-xs font-bold">Flights to Bali from $450</p>
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
          <Card className="border-white/5 bg-zinc-950/20 rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <ErrorBoundary name="Mood Board">
                <MoodBoard destination="Tokyo" />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader title={t('home.section_community_title')} description={t('home.section_community_desc')} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8">
             <ErrorBoundary name="Arabic Travelers">
               <ArabicTravelers />
             </ErrorBoundary>
           </div>
           <div className="lg:col-span-4 space-y-6">
              <Card className="bg-gradient-to-br from-orange-500/10 to-emerald-500/10 border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]">
                 <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl"><Users className="h-10 w-10 text-emerald-400" /></div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">StayX Buddies</h3>
                    <p className="text-zinc-500 text-sm font-medium">Connect with travelers visiting the same destinations as you.</p>
                 </div>
                 <Button className="rounded-lg bg-white text-black font-black uppercase tracking-widest px-8 hover:bg-white/90 shadow-xl transition-all active:scale-95" onClick={() => onNavigate('nav.buddies')}>
                    {t('home.buddies')}
                 </Button>
              </Card>
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4">
                 <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-black text-white uppercase tracking-widest italic">Global Expert Network</span>
                 </div>
                 <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase">
                   Verified guides and travel experts from over 50 countries available for live consultations.
                 </p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
