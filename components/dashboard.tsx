'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plane, Youtube, LogOut, Mic, Compass, Bell, LayoutDashboard, Plus, Search as SearchIcon } from 'lucide-react';
import { HomeView } from './home-view';
import { TripsView } from './trips-view';
import { WatchRoom } from './watch-room';
import { NotificationsView } from './notifications-view';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

import { SearchCompareView } from './search-compare-view';
import { useI18n } from '@/lib/i18n';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState('home');
  const [tripsCount, setTripsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
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
        
        // Clear the query params
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

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 px-2 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <Plane className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">StayX</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="text-xs font-mono"
          >
            {language === 'en' ? 'عربي' : 'EN'}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
          <SidebarButton icon={LayoutDashboard} label={t('nav.dashboard')} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <SidebarButton icon={Plane} label={t('nav.trips')} active={activeTab === 'trips'} onClick={() => setActiveTab('trips')} badge={tripsCount > 0 ? tripsCount.toString() : undefined} />
          <SidebarButton icon={Compass} label={t('nav.search')} active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          <SidebarButton icon={Youtube} label={t('nav.watch')} active={activeTab === 'watch'} onClick={() => setActiveTab('watch')} badge="Live" />
          <SidebarButton icon={Bell} label={t('nav.notifications')} active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} badge={notificationsCount > 0 ? notificationsCount.toString() : undefined} />
          
          <div className="pt-6 pb-2 px-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2"
                onClick={() => setActiveTab('trips')}
              >
                <Plus className="h-4 w-4 text-emerald-500" /> New Trip
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2"
                onClick={() => setActiveTab('search')}
              >
                <SearchIcon className="h-4 w-4 text-blue-500" /> Search Deals
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2"
                onClick={() => window.dispatchEvent(new Event('start-voice-agent'))}
              >
                <Mic className="h-4 w-4 text-rose-500" /> Voice Assistant
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'home' && <HomeView onNavigate={setActiveTab} />}
          {activeTab === 'trips' && <TripsView />}
          {activeTab === 'search' && <SearchCompareView />}
          {activeTab === 'watch' && <WatchRoom />}
          {activeTab === 'notifications' && <NotificationsView />}
        </main>
      </div>
    </div>
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
