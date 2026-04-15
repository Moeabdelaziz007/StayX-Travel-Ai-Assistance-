'use client';

import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { VoiceOverlay } from './VoiceOverlay';
import { motion, AnimatePresence } from 'motion/react';

export function VoiceTrigger() {
  const { isActive, state, transcript, startSession, stopSession } = useVoiceAgent();

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[90]">
        <AnimatePresence>
          {!isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                onClick={startSession}
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 flex items-center justify-center group"
              >
                <Mic className="h-8 w-8 text-white group-hover:animate-pulse" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <VoiceOverlay 
        isActive={isActive} 
        state={state} 
        transcript={transcript} 
        onClose={stopSession} 
      />
    </>
  );
}
