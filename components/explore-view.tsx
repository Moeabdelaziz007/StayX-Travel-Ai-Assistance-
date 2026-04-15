'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Star, ArrowRight, Filter, Globe } from 'lucide-react';
import { addAppointment } from '@/lib/travel-tools';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

const EXPLORE_ITEMS = [
  { id: '1', title: 'Le Bernardin', type: 'restaurant', location: 'New York, NY', rating: 4.9, price: 250, image: 'https://picsum.photos/seed/restaurant1/800/600', description: 'Elite French seafood in a sophisticated setting.' },
  { id: '2', title: 'Aman Tokyo', type: 'hotel', location: 'Tokyo, Japan', rating: 4.8, price: 1200, image: 'https://picsum.photos/seed/hotel1/800/600', description: 'Urban sanctuary with minimalist Japanese design.' },
  { id: '3', title: 'Grand Canyon Hike', type: 'outdoor', location: 'Arizona, USA', rating: 4.9, price: 50, image: 'https://picsum.photos/seed/outdoor1/800/600', description: 'Breathtaking trails through geological history.' },
  { id: '4', title: 'AMC Empire 25', type: 'cinema', location: 'New York, NY', rating: 4.5, price: 20, image: 'https://picsum.photos/seed/cinema1/800/600', description: 'Premium cinematic experience in the heart of Times Square.' },
  { id: '5', title: 'Coachella 2024', type: 'event', location: 'Indio, CA', rating: 4.7, price: 499, image: 'https://picsum.photos/seed/event1/800/600', description: 'The ultimate desert music and arts festival.' },
  { id: '6', title: 'The Ritz Paris', type: 'hotel', location: 'Paris, France', rating: 5.0, price: 1500, image: 'https://picsum.photos/seed/hotel2/800/600', description: 'Legendary luxury in the Place Vendôme.' },
];

export function ExploreView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredItems = EXPLORE_ITEMS.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         item.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  const handleBook = async (item: any) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await addAppointment({
        title: item.title,
        date: tomorrow.toISOString(),
        type: item.type === 'outdoor' ? 'other' : item.type,
        details: item.location,
        price: item.price
      });
      toast.success(`Booking request for ${item.title} sent!`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Search & Filter Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-green-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Global Discovery</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-white uppercase italic leading-none">
            Explore <span className="text-zinc-800">World</span>
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
            <Input 
              placeholder="Search venues..." 
              className="h-14 pl-12 bg-zinc-900/50 border-zinc-800 text-white rounded-2xl focus:ring-green-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-14 px-6 rounded-2xl border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {['all', 'restaurant', 'hotel', 'outdoor', 'cinema', 'event'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="group border-zinc-800 bg-zinc-900/30 overflow-hidden rounded-[2.5rem] hover:border-green-500/30 transition-all duration-500">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-black/80 backdrop-blur-xl border-zinc-800 py-1.5 px-3 rounded-full">
                      <Star className="h-3 w-3 text-green-500 mr-1.5 fill-green-500" />
                      <span className="text-xs font-bold text-white">{item.rating}</span>
                    </Badge>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{item.title}</h3>
                  </div>
                </div>
                <CardContent className="p-8 space-y-6">
                  <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Starting from</span>
                      <span className="text-2xl font-black text-white tracking-tighter">${item.price}</span>
                    </div>
                    <Button 
                      onClick={() => handleBook(item)}
                      className="h-14 w-14 rounded-2xl bg-white text-black hover:bg-green-500 transition-all group/btn"
                    >
                      <ArrowRight className="h-6 w-6 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
