'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Youtube, User, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import NextImage from 'next/image';

const travelers = [
  { name: 'Joe Hattab', channel: 'Joe Hattab', subscribers: '12M+', id: 'joehattab', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop' },
  { name: 'عمر فاروق', channel: 'Omar Farooq', subscribers: '7M+', id: 'omar', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
  { name: 'يوسف العربي', channel: 'Youssef Al-Arabi', subscribers: '2M+', id: 'youssef', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop' },
  { name: 'هيفاء بسيسو', channel: 'Haifa Beseisso', subscribers: '1M+', id: 'haifa', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
  { name: 'أحمد البدوي', channel: 'Ahmed Al-Badawi', subscribers: '1.5M+', id: 'ahmed', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop' },
  { name: 'فطيم', channel: 'Futaim', subscribers: '800K+', id: 'futaim', image: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=400&h=400&fit=crop' },
  { name: 'جاسم', channel: 'Jassim', subscribers: '500K+', id: 'jassim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
  { name: 'سارة', channel: 'Sara Travels', subscribers: '300K+', id: 'sara', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop' },
];

export function ArabicTravelers() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {travelers.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -5 }}
          className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:bg-zinc-900/60 transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-4 w-4 text-emerald-400" />
          </div>
          
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-emerald-500/20 group-hover:border-emerald-500 Transition-all duration-500">
              <NextImage 
                src={t.image}
                alt={t.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="space-y-1">
              <p className="font-black text-white text-lg leading-tight">{t.name}</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.channel}</p>
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                <p className="text-[10px] text-emerald-500 font-bold tracking-wider">{t.subscribers}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${60 + Math.random() * 30}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
              />
            </div>
            <p className="text-[8px] text-zinc-600 font-bold uppercase mt-2 tracking-widest text-center">Engagement Rate</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
