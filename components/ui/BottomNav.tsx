'use client';

import { Home, Compass, Map, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'المخطط', path: '/planner', icon: Compass },
    { name: 'الخريطة', path: '/destinations', icon: Map },
    { name: 'الدردشة', path: '/room', icon: MessageSquare },
    { name: 'الملف', path: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe pt-2">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-green-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={24} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
