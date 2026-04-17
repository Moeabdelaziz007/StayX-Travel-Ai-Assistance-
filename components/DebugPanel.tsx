'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, Activity, Server, Database, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { debugStats } from '@/lib/error-handler';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { isOnline } = useErrorHandler();
  const [stats, setStats] = useState(debugStats);

  // Poll for stats changes
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...debugStats });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  const handleClearCache = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      alert('Cache cleared successfully');
    }
  };

  const handleExportErrors = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats.recentErrors, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "stayx_errors.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full bg-zinc-900 border-zinc-800 h-10 w-10 shadow-lg"
      >
        <Settings className="h-5 w-5 text-zinc-400" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-zinc-950 border-r border-zinc-800 z-[60] p-6 shadow-2xl flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Debug Panel
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-zinc-500">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-tighter flex items-center gap-2">
                    <Server className="h-3 w-3" /> API Calls
                  </span>
                  <span className="text-white font-mono">{stats.apiCalls}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-tighter flex items-center gap-2">
                    <Database className="h-3 w-3" /> Connection
                  </span>
                  <span className={isOnline ? "text-green-500" : "text-red-500"}>
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-tighter flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500" /> Errors caught
                  </span>
                  <span className="text-white font-mono">{stats.recentErrors.length}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={handleClearCache} className="w-full justify-start gap-2 border-zinc-800 text-xs py-5">
                  <Trash2 className="h-4 w-4 text-orange-500" />
                  Clear Browser Cache
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportErrors} className="w-full justify-start gap-2 border-zinc-800 text-xs py-5">
                  <Download className="h-4 w-4 text-blue-500" />
                  Export Error Logs (JSON)
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-2">Recent Errors</h3>
                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                  {stats.recentErrors.length === 0 ? (
                    <p className="text-[10px] text-zinc-700 italic px-2">No errors logged in this session.</p>
                  ) : (
                    stats.recentErrors.map((err, i) => (
                      <div key={i} className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px]">
                        <p className="text-red-400 font-bold mb-1 truncate">{err.context}</p>
                        <p className="text-zinc-500 line-clamp-2">{err.errorMessage}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
