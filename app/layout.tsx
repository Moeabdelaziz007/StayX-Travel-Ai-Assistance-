import type {Metadata} from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'StayX - Travel AI',
  description: 'Your AI voice-based personal travel assistant',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans dark", geist.variable)}>
      <body suppressHydrationWarning className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <I18nProvider>
            {children}
            <Toaster />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
