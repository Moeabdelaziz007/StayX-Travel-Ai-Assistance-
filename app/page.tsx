'use client';

import { useAuth } from '@/lib/auth-context';
import { Login } from '@/components/login';
import { Dashboard } from '@/components/dashboard';
import { Suspense } from 'react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
      </div>
    }>
      <Dashboard />
    </Suspense>
  );
}
