'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from "next-themes";
import { Moon, Sun, Plane, Youtube, LogOut, Mic, Compass, Bell, LayoutDashboard, Plus, Search as SearchIcon, Menu, X } from 'lucide-react';
import { YouTubeRoomService } from './YouTubeRoomService';
import { HomeView } from './home-view';
import { TripsView } from './trips-view';
import { NotificationsView } from './notifications-view';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

import { SearchCompareView } from './search-compare-view';
import { useI18n } from '@/lib/i18n';
import { CommandMenu } from './CommandMenu';
import { TripPlannerPro } from './TripPlannerPro';
import { LiveTranslator } from './LiveTranslator';
import { BudgetManager } from './planner/BudgetManager';
import { QuickActionBar } from './QuickActionBar';
import { ProgressTracker } from './ProgressTracker';
import { DashboardSkeleton } from './DashboardSkeleton';
import { Onboarding } from './Onboarding';
import { Sparkles, Languages, Wallet } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function SidebarButton({ icon: Icon, label, active, onClick, badge }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
        active 
          ? 'bg-zinc-800/80 text-white shadow-lg shadow-black/20' 
          : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
          badge === 'Live' 
            ? 'bg-rose-500/20 text-rose-500 animate-pulse' 
            : 'bg-zinc-800 text-zinc-400'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState('home');
  const [tripsCount, setTripsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.uid}`);
      if (!hasSeenOnboarding) {
        const t = setTimeout(() => setShowOnboarding(true), 100);
        return () => clearTimeout(t);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // Simulate initial load for skeleton
    const timer = setTimeout(() => setIsLoading(false), 1500);
    
    // Listen to trips
    const tripsQuery = query(collection(db, 'trips'), where('userId', '==', user.uid));
    const unsubscribeTrips = onSnapshot(tripsQuery, (snapshot) => {
      setTripsCount(snapshot.docs.length);
    });

    // Listen to notifications (invitations)
    const notifsQuery = query(collection(db, 'invitations'), where('receiverEmail', '==', user.email), where('status', '==', 'pending'));
    const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
      setNotificationsCount(snapshot.docs.length);
    });

    return () => {
      unsubscribeTrips();
      unsubscribeNotifs();
    };
  }, [user]);

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.success && data.metadata) {
        const { tripId, appointmentId, type } = data.metadata;
        
        if (type === 'trip' && tripId) {
          await updateDoc(doc(db, 'trips', tripId), {
            paymentStatus: 'paid',
            stripeSessionId: sessionId
          });
          toast.success("Trip payment confirmed!");
        } else if (type === 'appointment' && appointmentId) {
          await updateDoc(doc(db, 'appointments', appointmentId), {
            paymentStatus: 'paid',
            stripeSessionId: sessionId
          });
          toast.success("Appointment payment confirmed!");
        }
        
        router.replace('/dashboard');
      }
    } catch (e) {
      console.error("Verification error:", e);
      toast.error("Failed to verify payment");
    }
  }, [router]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId);
    }
  }, [searchParams, verifyPayment]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-8 px-2 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
            <Plane className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">StayX</span>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="text-xs font-mono"
          >
            {language === 'en' ? 'عربي' : 'EN'}
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        <SidebarButton icon={LayoutDashboard} label={t('nav.dashboard')} active={activeTab === 'home'} onClick={() => handleTabChange('home')} />
        <SidebarButton icon={Sparkles} label="AI Planner Pro" active={activeTab === 'planner-pro'} onClick={() => handleTabChange('planner-pro')} />
        <SidebarButton icon={Wallet} label="Budget & Expenses" active={activeTab === 'budget'} onClick={() => handleTabChange('budget')} />
        <SidebarButton icon={Languages} label="Live Translator" active={activeTab === 'translator'} onClick={() => handleTabChange('translator')} />
        <SidebarButton icon={Plane} label={t('nav.trips')} active={activeTab === 'trips'} onClick={() => handleTabChange('trips')} badge={tripsCount > 0 ? tripsCount.toString() : undefined} />
        <SidebarButton icon={Compass} label={t('nav.search')} active={activeTab === 'search'} onClick={() => handleTabChange('search')} />
        <SidebarButton icon={Youtube} label={t('nav.watch')} active={activeTab === 'watch'} onClick={() => handleTabChange('watch')} badge="Live" />
        <SidebarButton icon={Bell} label={t('nav.notifications')} active={activeTab === 'notifications'} onClick={() => handleTabChange('notifications')} badge={notificationsCount > 0 ? notificationsCount.toString() : undefined} />
        
        <div className="pt-6 pb-2 px-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Quick Actions</p>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2"
              onClick={() => handleTabChange('trips')}
            >
              <Plus className="h-4 w-4 text-emerald-500" /> New Trip
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2"
              onClick={() => handleTabChange('search')}
            >
              <SearchIcon className="h-4 w-4 text-blue-500" /> Search Deals
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2"
              onClick={() => window.dispatchEvent(new Event('start-voice-agent'))}
            >
              <Mic className="h-4 w-4 text-rose-500" /> Voice Assistant <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">⌘K</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="h-10 w-10 border border-zinc-700">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user?.displayName}</span>
            <span className="text-xs text-zinc-400 truncate">{user?.email}</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <CommandMenu onNavigate={setActiveTab} />
      {showOnboarding && <Onboarding onComplete={() => {
        setShowOnboarding(false);
        localStorage.setItem(`onboarding_${user?.uid}`, 'true');
      }} />}
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[256px] border-r border-zinc-800 bg-zinc-900/50 p-4 flex-col flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col z-50 md:hidden shadow-2xl"
            >
              <div className="absolute right-4 top-6">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                <Plane className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight">StayX</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Avatar className="h-8 w-8 border border-zinc-700">
               <AvatarImage src={user?.photoURL || ''} />
               <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
             </Avatar>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {activeTab === 'home' && (
                <div className="space-y-6">
                  <ProgressTracker steps={[
                    { label: 'Flights', completed: true },
                    { label: 'Hotel', completed: true },
                    { label: 'Visa', completed: false },
                    { label: 'Insurance', completed: false },
                  ]} />
                  <HomeView onNavigate={setActiveTab} tripsCount={tripsCount} />
                </div>
              )}
              {activeTab === 'planner-pro' && <TripPlannerPro />}
              {activeTab === 'budget' && <BudgetManager />}
              {activeTab === 'translator' && <LiveTranslator />}
              {activeTab === 'trips' && <TripsView />}
              {activeTab === 'search' && <SearchCompareView />}
              {activeTab === 'watch' && <YouTubeRoomService destination="" />}
              {activeTab === 'notifications' && <NotificationsView />}
            </>
          )}
        </main>
        
        <QuickActionBar onNavigate={setActiveTab} />
      </div>
    </div>
  );
}
