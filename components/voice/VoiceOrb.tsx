'use client';

import { motion } from 'motion/react';

interface VoiceOrbProps {
  state: 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking';
}

export function VoiceOrb({ state }: VoiceOrbProps) {
  const getColors = () => {
    switch (state) {
      case 'listening': return 'from-emerald-400 to-blue-500';
      case 'processing': return 'from-blue-400 to-purple-500';
      case 'speaking': return 'from-purple-400 to-pink-500';
      case 'connecting': return 'from-zinc-400 to-zinc-600';
      default: return 'from-emerald-500 to-emerald-700';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <motion.div
        animate={{
          scale: state === 'listening' ? [1, 1.2, 1] : 1,
          opacity: state === 'listening' ? [0.3, 0.6, 0.3] : 0.2,
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${getColors()}`}
      />

      <motion.div
        animate={{
          scale: state === 'speaking' ? [1, 1.1, 1] : 1,
          rotate: state === 'processing' ? 360 : 0,
        }}
        transition={{ 
          scale: { duration: 0.5, repeat: Infinity },
          rotate: { duration: 2, repeat: Infinity, ease: "linear" }
        }}
        className={`relative w-20 h-20 rounded-full bg-gradient-to-tr ${getColors()} shadow-2xl flex items-center justify-center overflow-hidden border-2 border-white/20`}
      >
        {state === 'listening' && (
          <div className="flex gap-1 items-center h-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [4, 24, 4] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                className="w-1 bg-white rounded-full"
              />
            ))}
          </div>
        )}

        {state === 'speaking' && (
          <div className="flex gap-1 items-end h-10">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [8, 32, 8] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
                className="w-2 bg-white/80 rounded-t-sm"
              />
            ))}
          </div>
        )}

        {state === 'idle' && (
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-4 h-4 rounded-full bg-white/40"
          />
        )}
      </motion.div>
    </div>
  );
}
