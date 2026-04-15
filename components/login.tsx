'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, Mic, Map, Music, Youtube, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Login() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await login();
    } catch (err: any) {
      console.error(err);
      // Map Firebase error codes to user-friendly messages
      const errorCode = err.code;
      switch (errorCode) {
        case 'auth/popup-closed-by-user':
          setError('The login popup was closed before completing. Please try again.');
          break;
        case 'auth/cancelled-popup-request':
          setError('The login request was cancelled. Please try again.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection.');
          break;
        case 'auth/invalid-email':
          setError('The email address is invalid.');
          break;
        case 'auth/weak-password':
          setError('The password is too weak.');
          break;
        case 'auth/user-not-found':
          setError('No user found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        default:
          setError(err.message || 'An unexpected error occurred during login.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/travel/1920/1080?blur=4')] bg-cover bg-center opacity-20" />
      
      <Card className="z-10 w-full max-w-md border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500">
            <Plane className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">StayX</CardTitle>
          <CardDescription className="text-zinc-400">
            Your AI Voice-Based Personal Travel Assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-3">
              <Mic className="h-4 w-4 text-green-400" />
              <span>Voice AI</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-3">
              <Map className="h-4 w-4 text-blue-400" />
              <span>Smart Maps</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-3">
              <Youtube className="h-4 w-4 text-red-400" />
              <span>Watch Room</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-3">
              <Music className="h-4 w-4 text-purple-400" />
              <span>AI Music</span>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full bg-white text-black hover:bg-zinc-200"
            size="lg"
          >
            {isLoggingIn ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-800 border-t-transparent mr-2" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
