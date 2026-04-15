'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, MapPin, Calendar as CalendarIcon, Plus, CreditCard } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { initiatePayment } from '@/lib/travel-tools';
import { toast } from 'sonner';
import { CalendarView } from './calendar-view';
import { WeatherWidget } from './weather-widget';
import { TripPlanner } from './trip-planner';

export function TripsView() {
  const [trips, setTrips] = useState<any[]>([]);

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
          <h1 className="text-3xl font-bold tracking-tight text-white">My Trips & Itinerary</h1>
          <p className="text-zinc-400">Manage your upcoming adventures, bookings, and schedule.</p>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          New Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trips & Weather */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weather Widget */}
          <div className="h-[200px]">
            <WeatherWidget location={trips.length > 0 ? trips[0].destination : "Paris, France"} />
          </div>

          <h2 className="text-xl font-semibold text-white pt-4">Bookings & Payments</h2>
          {trips.length === 0 && (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              <Plane className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No trips booked yet.</p>
              <p className="text-sm">Ask StayX to plan your next adventure!</p>
            </div>
          )}
          {trips.map(trip => (
            <Card key={trip.id} className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer group">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-green-400 group-hover:bg-green-500/10 transition-colors">
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trip.status === 'booked' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {trip.status?.charAt(0).toUpperCase() + trip.status?.slice(1)}
                    </span>
                    {trip.paymentStatus && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trip.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {trip.paymentStatus.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {trip.paymentStatus === 'unpaid' && (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-black font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayment(trip);
                        }}
                      >
                        <CreditCard className="mr-2 h-3 w-3" />
                        Pay Now
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column: Calendar & Planner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-4">
            <CalendarView />
          </div>
          <TripPlanner />
        </div>
      </div>
    </div>
  );
}
