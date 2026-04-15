'use client';

import { motion, AnimatePresence } from 'motion/react';
import { VoiceOrb } from './VoiceOrb';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceOverlayProps {
  isActive: boolean;
  state: 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking';
  transcript: string;
  onClose: () => void;
  onConnectCalendar?: () => void;
  hasCalendar?: boolean;
}

export function VoiceOverlay({ isActive, state, transcript, onClose, onConnectCalendar, hasCalendar }: VoiceOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-2xl"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-6 right-6 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="flex flex-col items-center gap-12 max-w-2xl px-6 text-center">
            <VoiceOrb state={state} />
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {state === 'connecting' && 'Connecting to StayX...'}
                {state === 'listening' && 'Listening...'}
                {state === 'processing' && 'Thinking...'}
                {state === 'speaking' && 'StayX is speaking'}
                {state === 'idle' && 'Ready'}
              </h2>
              
              <div className="min-h-[4rem] flex items-center justify-center">
                <p className="text-xl text-zinc-400 font-medium leading-relaxed italic">
                  {transcript || (state === 'listening' ? 'Say something like "Plan a trip to Tokyo"' : '')}
                </p>
              </div>

              {!hasCalendar && onConnectCalendar && (
                <Button 
                  onClick={onConnectCalendar}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
                >
                  Connect Google Calendar
                </Button>
              )}
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm text-zinc-500 uppercase tracking-[0.2em] font-bold"
            >
              Tap anywhere to stop or say &quot;Goodbye&quot;
            </motion.p>
          </div>

          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
