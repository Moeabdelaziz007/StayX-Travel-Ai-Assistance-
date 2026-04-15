'use client';

import { motion } from 'motion/react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-pulse">
      <header className="flex flex-col gap-4">
        <div className="h-12 w-64 bg-zinc-800 rounded-2xl" />
        <div className="h-6 w-48 bg-zinc-900 rounded-xl" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-2 h-[300px] bg-zinc-900 rounded-[2rem]" />
        <div className="md:col-span-1 lg:col-span-2 h-[300px] bg-zinc-900 rounded-[2rem]" />
        <div className="md:col-span-1 lg:col-span-2 h-[300px] bg-zinc-900 rounded-[2rem]" />
        <div className="md:col-span-3 lg:col-span-4 h-[300px] bg-zinc-900 rounded-[2rem]" />
      </div>

      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-zinc-900 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
