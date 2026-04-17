'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookUser, PlaneTakeoff, ShieldAlert, Sparkles, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GoogleGenAI, Type } from '@google/genai';

export function VisaWidget() {
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheckVisa = async () => {
    if (!nationality || !destination) {
      toast.error('Please enter both nationality and destination.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Lazy initialize AI client
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      
      const prompt = `Provide the current tourist visa requirements for a citizen of ${nationality} traveling to ${destination}. 
      Return the output as a valid JSON object with the following structure:
      {
        "requiresVisa": boolean,
        "visaType": "string",
        "summary": "string",
        "duration": "string",
        "estimatedCost": "string",
        "link": "string"
      }
      If no official link is found, return an empty string for the link.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requiresVisa: { type: Type.BOOLEAN },
              visaType: { type: Type.STRING },
              summary: { type: Type.STRING },
              duration: { type: Type.STRING },
              estimatedCost: { type: Type.STRING },
              link: { type: Type.STRING }
            }
          }
        }
      });

      const rawText = response.text?.trim() || '{}';
      
      // Check for specific error strings that might be returned instead of JSON
      if (rawText.toLowerCase().includes('service unavailable') || rawText.toLowerCase().includes('!doctype')) {
        throw new Error('Server temporarily unavailable. Please try again.');
      }

      // Basic check for JSON structure
      if (!rawText.startsWith('{') && !rawText.startsWith('[')) {
        throw new Error('AI returned non-JSON response');
      }

      const data = JSON.parse(rawText);
      setResult(data);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to analyze visa requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full bg-zinc-900/50 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-900/40 px-5 py-4 z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
              <BookUser className="w-5 h-5" />
            </div>
            Smart Visa Helper
          </CardTitle>
          <div className="flex gap-1 items-center px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
            <Sparkles className="w-3 h-3" /> AI
          </div>
        </div>
        <CardDescription className="text-zinc-500 text-xs mt-1">
          Check visa requirements based on your passport.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5 flex-1 flex flex-col z-10">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">My Passport</label>
              <div className="relative">
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g. Saudi Arabia"
                  className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-indigo-500 rounded-xl pl-10 h-11"
                />
                <BookUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Destination</label>
              <div className="relative">
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Japan"
                  className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-indigo-500 rounded-xl pl-10 h-11"
                />
                <PlaneTakeoff className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCheckVisa}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:shadow-indigo-900/40"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Requirements'}
          </Button>
        </div>

        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-zinc-800/50 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${result.requiresVisa ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  {result.requiresVisa ? <ShieldAlert className="w-6 h-6" /> : <BookUser className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">
                    {result.visaType || (result.requiresVisa ? 'Visa Required' : 'Visa Free')}
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    {result.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Duration</p>
                  <p className="text-sm font-bold text-white">{result.duration || 'N/A'}</p>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Fee Estimate</p>
                  <p className="text-sm font-bold text-white">{result.estimatedCost || 'Free / Varies'}</p>
                </div>
              </div>

              {result.link && (
                <a href={result.link} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 p-3 rounded-xl transition-colors">
                  <Info className="w-4 h-4" /> Official Info / E-Visa Portal
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
