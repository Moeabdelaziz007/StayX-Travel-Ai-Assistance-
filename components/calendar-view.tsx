'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Utensils, Music, Plane, Calendar as CalendarIcon, CreditCard } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { initiatePayment } from '@/lib/travel-tools';
import { toast } from 'sonner';

export function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apptsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(apptsData);
    });

    return () => unsubscribe();
  }, []);

  const handlePayment = async (apt: any) => {
    try {
      await initiatePayment({
        amount: apt.price || 50,
        name: apt.title,
        description: `Booking for ${apt.title} at ${new Date(apt.date).toLocaleString()}`,
        metadata: { appointmentId: apt.id, type: 'appointment' }
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'restaurant': return Utensils;
      case 'nightclub': return Music;
      case 'flight': return Plane;
      case 'hotel': return MapPin;
      default: return CalendarIcon;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-green-500/20 text-green-400';
      case 'nightclub': return 'bg-purple-500/20 text-purple-400';
      case 'flight': return 'bg-blue-500/20 text-blue-400';
      case 'hotel': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (!date || !apt.date) return false;
    const aptDate = new Date(apt.date);
    const matchesDate = aptDate.getDate() === date.getDate() &&
                        aptDate.getMonth() === date.getMonth() &&
                        aptDate.getFullYear() === date.getFullYear();
    const matchesType = filterType === 'all' || apt.type === filterType;
    return matchesDate && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Schedule</h1>
          <p className="text-zinc-400">Manage your bookings, restaurants, and events.</p>
        </div>
        <div className="flex gap-2">
          {['all', 'restaurant', 'flight', 'hotel', 'nightclub'].map(type => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
              className={filterType === type ? 'bg-green-500 text-black' : 'border-zinc-800 text-zinc-400'}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-zinc-800 text-white"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">
            {date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
          </h3>
          
          {filteredAppointments.map(apt => {
            const Icon = getIconForType(apt.type);
            const colorClass = getColorForType(apt.type);
            const timeString = new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <Card key={apt.id} className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">{apt.title}</h4>
                      <div className="flex items-center gap-2">
                        {apt.paymentStatus && (
                          <Badge variant="outline" className={`border-none ${
                            apt.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {apt.paymentStatus.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                          <Clock className="mr-1 h-3 w-3" /> {timeString}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col gap-1">
                        {apt.details && (
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <MapPin className="h-4 w-4" />
                            <span>{apt.details}</span>
                          </div>
                        )}
                        {apt.price && <span className="text-xs text-zinc-500">Price: ${apt.price}</span>}
                      </div>
                      {apt.paymentStatus === 'unpaid' && (
                        <Button 
                          size="sm" 
                          className="h-8 bg-green-500 hover:bg-green-600 text-black font-semibold"
                          onClick={() => handlePayment(apt)}
                        >
                          <CreditCard className="mr-2 h-3 w-3" />
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredAppointments.length === 0 && (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              <p>No appointments for this date.</p>
              <p className="text-sm">Ask StayX to schedule something for you!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
