'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, Calendar, Youtube, Music, Map, LogOut, Mic, ShoppingBag, Users, Compass, Bell, LayoutDashboard } from 'lucide-react';
import { VoiceAssistant } from './voice-assistant';
import { HomeView } from './home-view';
import { TripsView } from './trips-view';
import { CalendarView } from './calendar-view';
import { WatchRoom } from './watch-room';
import { ExploreView } from './explore-view';
import { SocialView } from './social-view';
import { NotificationsView } from './notifications-view';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

import { SearchCompareView } from './search-compare-view';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

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
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
            <Plane className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">StayX</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
          <SidebarButton icon={LayoutDashboard} label="Dashboard" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <SidebarButton icon={Plane} label="My Trips" active={activeTab === 'trips'} onClick={() => setActiveTab('trips')} />
          <SidebarButton icon={Compass} label="SmartGet" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          <SidebarButton icon={Youtube} label="Watch Room" active={activeTab === 'watch'} onClick={() => setActiveTab('watch')} />
          <SidebarButton icon={Bell} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
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
          {activeTab === 'explore' && <ExploreView />}
          {activeTab === 'social' && <SocialView />}
          {activeTab === 'notifications' && <NotificationsView />}
        </main>

        {/* Floating Assistant Button */}
        <div className="absolute bottom-6 right-6 z-50">
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
            onClick={() => setIsAssistantOpen(true)}
          >
            <Mic className="h-8 w-8 text-black" />
          </Button>
        </div>
      </div>

      {/* Voice Assistant Overlay */}
      {isAssistantOpen && (
        <VoiceAssistant onClose={() => setIsAssistantOpen(false)} />
      )}
    </div>
  );
}

function SidebarButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active 
          ? 'bg-zinc-800 text-white' 
          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-green-400' : ''}`} />
      {label}
    </button>
  );
}
