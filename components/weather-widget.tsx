'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Loader2, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getWeather } from '@/lib/travel-tools';
import { motion } from 'motion/react';
import { safeFetchJson } from '@/lib/fetch-utils';

export function WeatherWidget({ location: initialLocation = 'Paris, France' }: { location?: string }) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState(initialLocation);

  const fetchWeather = async (loc: string) => {
    setLoading(true);
    try {
      const data = await safeFetchJson(`/api/weather?city=${encodeURIComponent(loc)}`);
      if (data) setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(currentLocation);
  }, [currentLocation]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setCurrentLocation(searchQuery);
      setSearchQuery('');
    }
  };

  if (loading && !weather) {
    return (
      <div className="flex h-[300px] items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-800">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  const getIcon = (code: number) => {
    if (code === 0) return <Sun className="h-12 w-12 text-yellow-400" />;
    if (code <= 3) return <Cloud className="h-12 w-12 text-zinc-300" />;
    if (code <= 67) return <CloudRain className="h-12 w-12 text-blue-400" />;
    return <Cloud className="h-12 w-12 text-zinc-300" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden group h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl rounded-xl overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
              <Input 
                placeholder="Check weather..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="h-8 pl-8 bg-zinc-950 border-zinc-800 text-xs text-white rounded-full focus:ring-green-500/50"
              />
            </div>
            <span className="text-xs font-mono text-green-500 uppercase tracking-widest whitespace-nowrap">Live AI Update</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-zinc-400 mb-4">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="font-medium">{weather?.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-5xl font-bold tracking-tighter text-white">
                    {Math.round(weather?.current?.temperature_2m)}°C
                  </div>
                  <div className="text-lg font-medium text-zinc-200">{weather?.current?.weather_code}</div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-green-500/20 rounded-full" />
                  {getIcon(weather?.current?.weather_code)}
                </div>
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
                <div className="flex justify-between gap-2 overflow-x-auto pb-2">
                  {weather?.daily?.time?.map((time: string, i: number) => (
                    <div key={time} className="flex flex-col items-center gap-1 min-w-[60px]">
                      <span className="text-[10px] text-zinc-500">{new Date(time).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-sm font-bold text-white">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                      <span className="text-[10px] text-zinc-400">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Wind className="h-3 w-3" />
                  <span>{weather?.current?.wind_speed_10m} km/h</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Thermometer className="h-3 w-3" />
                  <span>Feels like {Math.round(weather?.current?.apparent_temperature)}°C</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
