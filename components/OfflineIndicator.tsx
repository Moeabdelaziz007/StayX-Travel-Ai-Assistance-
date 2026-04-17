'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setHasChanged(true);
      toast.success('You are back online!', {
        icon: <Wifi className="h-4 w-4 text-green-500" />
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasChanged(true);
      toast.error('You are currently offline.', {
        icon: <WifiOff className="h-4 w-4 text-red-500" />
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white py-1 px-4 text-center text-xs font-bold flex items-center justify-center gap-2"
        >
          <WifiOff className="h-3 w-3" />
          <span>You are currently offline. Some features may be limited.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
