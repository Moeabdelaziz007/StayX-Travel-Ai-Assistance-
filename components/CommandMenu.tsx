'use client';

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, Plane, Compass, Bell, LayoutDashboard, Moon, Sun, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export function CommandMenu({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[640px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <Command label="Command Menu" className="p-2">
              <div className="flex items-center border-b border-zinc-800 px-3 pb-2">
                <Search className="mr-2 h-4 w-4 text-zinc-500" />
                <Command.Input 
                  placeholder="Type a command or search..." 
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm py-2"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                <Command.Empty className="py-6 text-center text-sm text-zinc-500">No results found.</Command.Empty>
                
                <Command.Group heading="Navigation" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-2">
                  <Item icon={LayoutDashboard} label="Dashboard" onSelect={() => runCommand(() => onNavigate('home'))} />
                  <Item icon={Plane} label="My Trips" onSelect={() => runCommand(() => onNavigate('trips'))} />
                  <Item icon={Compass} label="Search Deals" onSelect={() => runCommand(() => onNavigate('search'))} />
                  <Item icon={Bell} label="Notifications" onSelect={() => runCommand(() => onNavigate('notifications'))} />
                </Command.Group>

                <Command.Group heading="Settings" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-2">
                  <Item 
                    icon={theme === 'dark' ? Sun : Moon} 
                    label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`} 
                    onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))} 
                  />
                </Command.Group>

                <Command.Group heading="Voice" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-2">
                  <Item 
                    icon={Mic} 
                    label="Start Voice Assistant" 
                    onSelect={() => runCommand(() => window.dispatchEvent(new Event('start-voice-agent')))} 
                  />
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Item({ icon: Icon, label, onSelect }: { icon: any, label: string, onSelect: () => void }) {
  return (
    <Command.Item 
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors aria-selected:bg-zinc-800 aria-selected:text-white"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Command.Item>
  );
}
