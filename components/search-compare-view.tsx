'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plane, ExternalLink, Star, Loader2, Sparkles, Filter, TrendingUp, Tag, UserCheck, Mic, MapPin, Camera, Image as ImageIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchGroundingCompare, getSmartAutocomplete, visualSearchDestination } from '@/lib/travel-tools';
import { searchPlacesFoursquare } from '@/lib/foursquare';
import { WeatherWidget } from './weather-widget';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

export function SearchCompareView() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [weatherLocation, setWeatherLocation] = useState<string | null>(null);
  const [category, setCategory] = useState('restaurants');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleAutocomplete = async (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      const sugs = await getSmartAutocomplete(val);
      setSuggestions(sugs);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      toast.success(`Recognized: ${transcript}`);
      handleSearch(transcript);
    };
    recognition.start();
  };

  const handleVisualSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsSearching(true);
      try {
        const base64 = reader.result as string;
        const place = await visualSearchDestination(base64);
        setQuery(place);
        toast.success(`Identified: ${place}`);
        handleSearch(place);
      } catch (err) {
        toast.error("Failed to identify image");
      } finally {
        setIsSearching(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async (overrideQuery?: string) => {
    const searchQuery = overrideQuery || query;
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowSuggestions(false);
    setWeatherLocation(searchQuery); 
    setResults([]);
    setPlaces([]);
    try {
      const [data, placesData] = await Promise.all([
        searchGroundingCompare({ query: searchQuery }),
        searchPlacesFoursquare({ query: searchQuery, categories: category === 'restaurants' ? '13000' : '10000', limit: 6 })
      ]);
      setResults(data);
      setPlaces(placesData);
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

      <div className="relative group max-w-3xl mx-auto z-50">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur opacity-25" />
        <div className="relative flex flex-col md:flex-row gap-2 bg-zinc-900/60 backdrop-blur-xl p-2 rounded-3xl border border-zinc-800/50">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-600" />
            <Input 
              placeholder="Where to next? (e.g. Romantic trip on a budget)" 
              value={query}
              onChange={(e) => handleAutocomplete(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-16 pl-16 pr-24 bg-transparent border-none text-white text-lg focus-visible:ring-0"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleVoiceSearch}
                className={`h-10 w-10 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-zinc-500 hover:text-emerald-500'}`}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <label className="cursor-pointer">
                <input type="file" className="hidden" accept="image/*" onChange={handleVisualSearch} />
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-emerald-500 transition-all">
                  <Camera className="h-5 w-5" />
                </div>
              </label>
            </div>

            {/* Smart Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(s);
                      setShowSuggestions(false);
                      handleSearch(s);
                    }}
                    className="w-full text-left p-4 hover:bg-zinc-800 rounded-xl text-zinc-300 text-sm flex items-center gap-3 transition-colors group"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-500 group-hover:scale-125 transition-transform" />
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-40 h-16 bg-zinc-950 border-zinc-800 rounded-2xl text-zinc-400">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="restaurants">Restaurants</SelectItem>
              <SelectItem value="attractions">Attractions</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => handleSearch()} 
            disabled={isSearching}
            className="h-16 px-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        {weatherLocation && (
          <div className="lg:col-span-2 h-[350px] rounded-[3rem] overflow-hidden border border-zinc-800/50 shadow-2xl relative">
            <WeatherWidget location={weatherLocation} />
            <div className="absolute top-6 left-6 z-10">
               <Badge className="bg-black/60 backdrop-blur-md border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                 Live Grounding: {weatherLocation}
               </Badge>
            </div>
          </div>
        )}

        {isSearching && (
          <div className="lg:col-span-2 py-32 text-center space-y-6">
            <div className="relative inline-block">
              <Loader2 className="h-16 w-16 animate-spin text-emerald-500 mx-auto" />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-white text-xl font-black italic tracking-tight">AI is crafting your adventure...</p>
              <p className="text-zinc-500 text-sm font-medium animate-pulse uppercase tracking-[0.2em]">Comparing 50+ Global Engines</p>
            </div>
          </div>
        )}

        {!isSearching && places.length > 0 && (
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <MapPin className="h-8 w-8 text-emerald-500" /> Nearby Places
              </h3>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 font-black px-3 py-1 uppercase tracking-widest text-[10px]">Foursquare Direct</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place: any, i: number) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -5 }}
                  className="group relative overflow-hidden p-6 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-900/60 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-white leading-tight">{place.name}</h4>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">{place.location?.address || 'Explore Area'}</p>
                    </div>
                    {place.rating && <div className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">{place.rating}</div>}
                  </div>
                  <div className="relative h-32 rounded-2xl overflow-hidden border border-white/5">
                    <Image 
                      src={`https://image.pollinations.ai/prompt/${place.name}%20${place.location?.city}%20landmark%20interior%20cinematic?width=400&height=300&nologo=true`}
                      alt={place.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {!isSearching && sortedResults.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            className="lg:col-span-2"
          >
            <div className={`group relative p-8 md:p-12 rounded-[3.5rem] border backdrop-blur-2xl transition-all flex flex-col md:flex-row gap-10 items-center ${i === 0 ? 'bg-zinc-900/80 border-emerald-500/30 shadow-2xl shadow-emerald-500/10' : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60'}`}>
              <div className="relative w-full md:w-[280px] aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 group-hover:rotate-1 transition-transform duration-700 shadow-2xl shrink-0">
                <Image 
                  src={`https://image.pollinations.ai/prompt/${item.description}%20travel%20destination%20hq?width=600&height=800&nologo=true`}
                  alt={item.source}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <Badge className="bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] px-3 py-1">{item.source}</Badge>
                </div>
              </div>

              <div className="flex-1 space-y-8 w-full">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">Global Grounding Match</span>
                      {i === 0 && <span className="text-xs font-black text-emerald-500 uppercase flex items-center gap-1"><Sparkles className="h-3 w-3" /> Alpha Deal</span>}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none">{item.description}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Price Estimate</p>
                    <div className="text-4xl font-black text-emerald-400 tracking-tighter flex items-center justify-end gap-1">
                      <span className="text-xl font-medium text-emerald-500/60">$</span>
                      {item.price}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-1 text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Platform</p>
                    <p className="text-white font-bold text-sm">{item.source}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-1 text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Reliability</p>
                    <div className="flex items-center justify-center gap-1 text-yellow-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-white font-bold text-sm tracking-tight">{item.rating || '4.5'}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-16 rounded-[1.5rem] bg-white text-black hover:bg-zinc-200 gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-white/5 group-hover:scale-[1.02] transition-all"
                  onClick={() => window.open(item.link, '_blank')}
                >
                  Confirm & Secure Space <ExternalLink className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
