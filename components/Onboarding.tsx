'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Plane, Compass, Mic, Sparkles, ArrowRight } from 'lucide-react';

const steps = [
  {
    title: "Welcome to StayX",
    description: "Your AI-powered travel companion. We're here to make your next journey seamless.",
    icon: Plane,
    color: "text-emerald-500"
  },
  {
    title: "Smart Search",
    description: "Compare flights, hotels, and deals across global platforms in real-time.",
    icon: Compass,
    color: "text-blue-500"
  },
  {
    title: "Voice Assistant",
    description: "Just talk to StayX. Plan trips, book flights, and get advice using your voice.",
    icon: Mic,
    color: "text-rose-500"
  },
  {
    title: "AI Trip Planner",
    description: "Let our AI create personalized itineraries based on your preferences and budget.",
    icon: Sparkles,
    color: "text-purple-500"
  }
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className={`h-20 w-20 rounded-3xl bg-zinc-950 flex items-center justify-center mx-auto ${steps[currentStep].color}`}>
              <StepIcon className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">{steps[currentStep].title}</h2>
              <p className="text-zinc-400 leading-relaxed">{steps[currentStep].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-zinc-800'}`} 
            />
          ))}
        </div>

        <Button 
          onClick={next} 
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg group"
        >
          {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
}
