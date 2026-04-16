'use client';

import { motion } from 'motion/react';
import { Plane, Building2, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export function ProgressTracker({ steps }: { steps: { label: string, completed: boolean }[] }) {
  const currentStep = steps.findIndex(s => !s.completed);
  const progress = currentStep === -1 ? 100 : (currentStep / steps.length) * 100;

  const icons = [Plane, Building2, FileText, ShieldCheck];

  return (
    <div className="w-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl" />
      
      <div className="relative p-6 px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Master Plan</p>
            <h3 className="text-2xl font-black text-white tracking-tight">Trip Preparation</h3>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-white tabular-nums">{Math.round(progress)}%</span>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Status: {progress === 100 ? 'Ready' : 'In Progress'}</p>
          </div>
        </div>
        
        <div className="relative h-2 w-full bg-zinc-950/50 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {steps.map((step, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className="flex flex-col items-center gap-3 relative group/step">
                <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                  step.completed 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10' 
                    : 'bg-zinc-950/50 border-white/5 text-zinc-600'
                }`}>
                  <Icon className="h-6 w-6" />
                  {step.completed && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-emerald-500 text-black rounded-full p-0.5"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </motion.div>
                  )}
                </div>
                <div className="text-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    step.completed ? 'text-zinc-200' : 'text-zinc-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
