'use client';

import { motion } from 'motion/react';
import { Search, Mic, MapPin, MonitorPlay, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActionBar({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const actions = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'translator', icon: Mic, label: 'Translate' },
    { id: 'planner-pro', icon: MapPin, label: 'Plan' },
    { id: 'watch', icon: MonitorPlay, label: 'Watch' },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-full shadow-2xl flex items-center gap-1"
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(action.id)}
          className="rounded-full h-12 w-12 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-all"
          title={action.label}
        >
          <action.icon className="h-5 w-5" />
        </Button>
      ))}
    </motion.div>
  );
}
