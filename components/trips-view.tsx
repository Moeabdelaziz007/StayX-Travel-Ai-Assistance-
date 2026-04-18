'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plane, MapPin, Calendar as CalendarIcon, Plus, CreditCard, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { initiatePayment } from '@/lib/travel-tools';
import { toast } from 'sonner';
import { CalendarView } from './calendar-view';
import { WeatherWidget } from './weather-widget';
import { TripPlanner } from './trip-planner';
import { useI18n } from '@/lib/i18n';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export function TripsView() {
  const { t, language } = useI18n();
  const [trips, setTrips] = useState<any[]>([]);
  const [tips, setTips] = useState<string>('');
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState<string>('Paris, France');

  useEffect(() => {
    const fetchTips = async () => {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) return;
      setIsLoadingTips(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        const prompt = `Give me 3 short, creative travel tips for today. Language: ${language === 'ar' ? 'Arabic' : 'English'}. Format as markdown list.`;
        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });
        setTips(result.text || '');
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingTips(false);
      }
    };
    fetchTips();
  }, [language]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'trips'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrips(tripsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
    });

    return () => unsubscribe();
  }, []);

  const handlePayment = async (trip: any) => {
    try {
      await initiatePayment({
        amount: trip.budget || 100,
        name: `Trip to ${trip.destination}`,
        description: `Booking confirmation for your trip to ${trip.destination}`,
        metadata: { tripId: trip.id, type: 'trip' }
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('nav.trips')}</h1>
          <p className="text-zinc-400">Manage your upcoming adventures, bookings, and schedule.</p>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          {t('home.create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trips & Weather */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weather Widget */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Search city weather..." 
                className="bg-zinc-900 border-zinc-800 text-white rounded-2xl"
                onKeyDown={(e) => e.key === 'Enter' && setWeatherLocation(e.currentTarget.value)}
              />
            </div>
            <div className="h-[300px] rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl">
              <WeatherWidget location={weatherLocation} />
            </div>
          </div>

          {/* Today's Travel Tips */}
          <Card className="border-emerald-500/20 bg-zinc-900/40 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{t('trips.travel_tips')}</h3>
              </div>
              {isLoadingTips ? (
                <div className="flex items-center gap-2 text-zinc-500 text-sm animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating fresh tips...
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{tips}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold text-white pt-4">Bookings & Payments</h2>
          {trips.length === 0 && (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
              <Plane className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No trips booked yet.</p>
              <p className="text-sm">Ask StayX to plan your next adventure!</p>
            </div>
          )}
          {trips.map(trip => (
            <Card key={trip.id} className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-800/60 transition-all cursor-pointer group rounded-3xl overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{trip.destination}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                      {trip.startDate && (
                        <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {trip.startDate} {trip.endDate ? `- ${trip.endDate}` : ''}</span>
                      )}
                      {trip.budget && <span>Budget: ${trip.budget}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      trip.status === 'booked' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {trip.status}
                    </span>
                    {trip.paymentStatus && (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        trip.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {trip.paymentStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {trip.paymentStatus === 'unpaid' && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-9 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayment(trip);
                        }}
                      >
                        <CreditCard className="mr-2 h-3 w-3" />
                        Pay Now
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl">View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column: Calendar & Planner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] p-4 shadow-2xl">
            <CalendarView />
          </div>
          <TripPlanner />
        </div>
      </div>
    </div>
  );
}
