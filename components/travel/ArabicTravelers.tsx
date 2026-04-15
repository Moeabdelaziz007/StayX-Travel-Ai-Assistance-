'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Youtube, User } from 'lucide-react';

const travelers = [
  { name: 'يوسف العربي', channel: 'Youssef Al-Arabi' },
  { name: 'خليجي يسافر', channel: 'Khaleeji Travels' },
  { name: 'مصري يسافر', channel: 'Masri Travels' },
  { name: 'رحالة', channel: 'Rahala' },
  { name: 'سفر وحلال', channel: 'Safar Halal' },
  { name: 'Travel with Amira', channel: 'Travel with Amira' },
  { name: 'الرحالة المصري', channel: 'The Egyptian Traveler' },
  { name: 'Joe Hattab', channel: 'Joe Hattab' },
];

export function ArabicTravelers() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {travelers.map((t, i) => (
        <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50 transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t.name}</p>
              <p className="text-[10px] text-zinc-500">{t.channel}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
