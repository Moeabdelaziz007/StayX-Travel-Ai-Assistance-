import type {Metadata} from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/sonner';
import { VoiceAgent } from '@/components/voice-agent/VoiceAgent';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'StayX - Travel AI',
  description: 'Your AI voice-based personal travel assistant',
  manifest: '/manifest.json',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans dark", geist.variable)}>
      <head>
        <meta name="theme-color" content="#16a34a" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body suppressHydrationWarning className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <I18nProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <VoiceAgent />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
