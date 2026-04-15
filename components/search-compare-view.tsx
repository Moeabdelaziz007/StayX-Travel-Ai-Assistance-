'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plane, ExternalLink, Star, Loader2, Sparkles, Filter, TrendingUp, Tag, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchGroundingCompare } from '@/lib/travel-tools';
import { WeatherWidget } from './weather-widget';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export function SearchCompareView() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [weatherLocation, setWeatherLocation] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setWeatherLocation(query); // Auto-fetch weather
    try {
      const data = await searchGroundingCompare({ query });
      setResults(data);
      if (data.length === 0) {
        toast.info("No results found. Try a more specific query.");
      }
    } catch (e) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
    const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
    return priceA - priceB;
  });

  const avgPrice = results.length > 0 
    ? (results.reduce((acc, curr) => acc + (parseFloat(String(curr.price).replace(/[^0-9.]/g, '')) || 0), 0) / results.length).toFixed(0)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-5xl font-light text-white tracking-tight">
          Smart <span className="text-emerald-500">Compare</span>
        </h1>
        <p className="text-zinc-500 text-lg">Real-time price comparison engine for the discerning traveler.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            icon: Search, 
            label: results.length > 0 ? t('stats.deals_found') : 'DEALS FOUND', 
            value: results.length > 0 ? results.length : 'Search to find deals', 
            color: 'text-emerald-500' 
          },
          { 
            icon: Plane, 
            label: results.length > 0 ? t('stats.avg_price') : 'AVG PRICE', 
            value: results.length > 0 ? `$${avgPrice}` : 'Dubai from $299', 
            color: 'text-blue-500' 
          },
          { 
            icon: Mic, 
            label: results.length > 0 ? t('stats.best_platform') : 'BEST PLATFORM', 
            value: results.length > 0 ? results[0].source : 'Try voice search!', 
            color: 'text-purple-500' 
          }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-6 rounded-3xl flex items-center gap-4 hover:bg-zinc-900/60 transition-all">
            <div className={`h-12 w-12 rounded-2xl bg-zinc-950 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{stat.label}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative group max-w-3xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur opacity-25" />
        <div className="relative flex gap-2 bg-zinc-900/60 backdrop-blur-xl p-2 rounded-3xl border border-zinc-800/50">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-600" />
          <Input 
            placeholder="Where to next? (e.g. Flights to Tokyo)" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-16 pl-16 bg-transparent border-none text-white text-lg focus-visible:ring-0"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="h-16 px-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {weatherLocation && (
          <div className="lg:col-span-2 h-[300px] rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl">
            <WeatherWidget location={weatherLocation} />
          </div>
        )}

        {isSearching && (
          <div className="lg:col-span-2 py-20 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto" />
            <p className="text-zinc-500 animate-pulse">Scanning global booking engines...</p>
          </div>
        )}

        {!isSearching && sortedResults.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={`group p-8 rounded-3xl border backdrop-blur-md transition-all ${i === 0 ? 'bg-zinc-900/80 border-emerald-500/30 shadow-xl shadow-emerald-500/5' : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{item.source}</span>
                    {i === 0 && <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">Best Deal</span>}
                  </div>
                  <h3 className="text-xl font-light text-white">{item.description}</h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-light text-white">{item.currency} {item.price}</div>
                  {item.rating && (
                    <div className="flex items-center justify-end gap-1 text-yellow-500 text-sm mt-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{item.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-zinc-700 hover:bg-zinc-800 gap-2 text-white font-bold"
                onClick={() => window.open(item.link, '_blank')}
              >
                View Deal <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
