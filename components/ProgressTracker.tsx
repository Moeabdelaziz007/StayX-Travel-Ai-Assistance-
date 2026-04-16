'use client';

import { motion } from 'motion/react';
import { Plane, Building2, Passport, CheckCircle2 } from 'lucide-react';

export function ProgressTracker({ steps }: { steps: { label: string, completed: boolean }[] }) {
  const currentStep = steps.findIndex(s => !s.completed);
  const progress = currentStep === -1 ? 100 : (currentStep / steps.length) * 100;

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
      <div className="flex justify-between items-center text-sm font-bold text-white">
        <span>Trip Preparation</span>
        <span className="text-emerald-500">{Math.round(progress)}% Complete</span>
      </div>
      
      <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex">
        {steps.map((step, i) => (
          <div 
            key={i}
            className={`h-full ${step.completed ? 'bg-emerald-500' : 'bg-zinc-800'} transition-all duration-500`}
            style={{ width: `${100 / steps.length}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full ${step.completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
              {step.completed ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4" />}
            </div>
            <span className="text-[10px] uppercase font-bold text-zinc-400">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
