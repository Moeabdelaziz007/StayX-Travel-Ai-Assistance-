'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Music, Palette, Map, Loader2, Compass, Heart, TreePine, Users, Landmark } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Button } from '@/components/ui/button';

const MOODS = [
  { id: 'adventure', name: 'Adventure', icon: Compass, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'relax', name: 'Relaxation', icon: TreePine, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'romantic', name: 'Romantic', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'family', name: 'Family', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'culture', name: 'Cultural', icon: Landmark, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

interface MoodInsight {
  itinerary: string;
  playlist: string[];
  colors: string[];
}

export function MoodBoard({ destination }: { destination: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState('adventure');
  const [insight, setInsight] = useState<MoodInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMoodData = useCallback(async (mood: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Images from Unsplash
      const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;
      if (key) {
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${destination}+${mood}&per_page=6&client_id=${key}`);
        const data = await res.json();
        setImages(data.results || []);
      } else {
        // Fallback
        setImages([
          { id: '1', urls: { regular: `https://picsum.photos/seed/${destination}${mood}1/400/300` } },
          { id: '2', urls: { regular: `https://picsum.photos/seed/${destination}${mood}2/400/300` } },
          { id: '3', urls: { regular: `https://picsum.photos/seed/${destination}${mood}3/400/300` } },
          { id: '4', urls: { regular: `https://picsum.photos/seed/${destination}${mood}4/400/300` } },
        ]);
      }

      // 2. Generate Insight with Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const prompt = `Generate a travel mood guide for ${destination} with a ${mood} mood. 
      Return a JSON object with:
      - itinerary: A 2-sentence summary of the perfect ${mood} experience in ${destination}.
      - playlist: 3 song names or genres.
      - colors: 3 hex color codes that match this mood and destination.
      Return ONLY the JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setInsight(JSON.parse(jsonMatch[0]));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [destination]);

  useEffect(() => {
    fetchMoodData(selectedMood);
  }, [fetchMoodData, selectedMood]);

  return (
    <div className="space-y-8">
      {/* Mood Selector */}
      <div className="flex flex-wrap gap-3">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          const isActive = selectedMood === mood.id;
          return (
            <Button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              variant="outline"
              className={`h-11 rounded-lg gap-2 border-zinc-800 transition-all duration-300 ${
                isActive ? `${mood.bg} ${mood.color} border-${mood.id}-500/50 scale-105` : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {mood.name}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gallery */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[160px]">
          {images.map((img, i) => (
            <motion.div 
              key={img.id || i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl overflow-hidden group border border-white/5 ${
                i === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <NextImage 
                src={img.urls?.regular || img.urls?.small || img.urls} 
                alt={img.alt_description || destination} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* AI Insight Card */}
        <Card className="bg-zinc-900/40 backdrop-blur-xl border-zinc-800 rounded-2xl overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg">Mood Guide</h3>
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Powered by Gemini</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-zinc-500 text-sm animate-pulse">Generating your vibe...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  {/* Itinerary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Map className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">The Vibe Search</span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed italic text-sm">
                      &quot;{insight?.itinerary || 'Select a mood to generate a unique trip vibe...'}&quot;
                    </p>
                  </div>

                  {/* Palette */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Palette className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Trip Palette</span>
                    </div>
                    <div className="flex gap-3">
                      {insight?.colors.map((c, i) => (
                        <div key={i} className="group relative">
                          <div 
                            className="h-10 w-10 rounded-full border border-white/10 shadow-xl transition-transform hover:scale-110" 
                            style={{ backgroundColor: c }}
                          />
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {c}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Playlist */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Music className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Trip Soundtrack</span>
                    </div>
                    <div className="space-y-2">
                      {insight?.playlist.map((song, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                          <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                            {i+1}
                          </div>
                          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{song}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full h-11 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold group">
                    Start Planning
                    <Compass className="ml-2 h-4 w-4 group-hover:rotate-45 transition-transform" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
