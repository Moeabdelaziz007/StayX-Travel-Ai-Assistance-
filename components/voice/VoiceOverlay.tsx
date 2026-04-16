'use client';

import { motion, AnimatePresence } from 'motion/react';
import { VoiceOrb } from './VoiceOrb';
import { X, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface VoiceOverlayProps {
  isActive: boolean;
  state: 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking';
  transcript: string;
  history?: Message[];
  onClose: () => void;
  onConnectCalendar?: () => void;
  hasCalendar?: boolean;
}

export function VoiceOverlay({ isActive, state, transcript, history = [], onClose, onConnectCalendar, hasCalendar }: VoiceOverlayProps) {
  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-3xl"
        >
          {/* Header Actions */}
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-8 w-full max-w-4xl px-6 text-center">
            <VoiceOrb state={state} />
            
            <div className="space-y-6 w-full">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                  {state === 'connecting' && 'Establishing Connection...'}
                  {state === 'listening' && 'Listening...'}
                  {state === 'processing' && 'Analyzing...'}
                  {state === 'speaking' && 'StayX is Speaking'}
                  {state === 'idle' && 'Ready'}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${state === 'listening' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                  <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Live AI Session</span>
                </div>
              </div>
              
              <motion.div 
                layout
                className="min-h-[6rem] flex flex-col items-center justify-center px-4"
              >
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={transcript}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-2xl md:text-3xl text-zinc-300 font-medium leading-tight max-w-2xl mx-auto ${isArabic(transcript) ? 'font-arabic' : ''}`}
                    dir={isArabic(transcript) ? 'rtl' : 'ltr'}
                  >
                    {transcript || (state === 'listening' ? 'How can I help you today?' : '')}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* Suggestions / Proactive Hints */}
              {state === 'listening' && !transcript && (
                <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                  {['Plan trip to Tokyo', 'Weather in Cairo', 'Nearby hotels', 'Dashboard'].map((hint) => (
                    <Button 
                      key={hint}
                      variant="outline" 
                      size="sm"
                      className="rounded-full bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 h-8"
                    >
                      <Sparkles className="h-3 w-3 mr-2" /> {hint}
                    </Button>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <div className="pt-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <History className="h-4 w-4 text-zinc-600" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Recent Memory</span>
                  </div>
                  <ScrollArea className="h-24 max-w-md mx-auto">
                    <div className="space-y-3 px-4">
                      {history.slice(-3).map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <p className={`text-xs px-3 py-1.5 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-zinc-400 border border-white/10'}`}>
                            {msg.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {!hasCalendar && onConnectCalendar && state === 'idle' && (
                <Button 
                  onClick={onConnectCalendar}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 shadow-xl shadow-emerald-600/20"
                >
                  Connect Calendar for AI Management
                </Button>
              )}
            </div>
          </div>

          {/* Footer Guide */}
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-bold">
              Tap anywhere to stop or say &quot;Goodbye&quot;
            </p>
          </div>

          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] transition-colors duration-1000 ${state === 'listening' ? 'bg-emerald-500/10' : state === 'speaking' ? 'bg-blue-500/10' : 'bg-purple-500/5'}`} />
            <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] transition-colors duration-1000 ${state === 'processing' ? 'bg-purple-500/10' : 'bg-zinc-500/5'}`} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
