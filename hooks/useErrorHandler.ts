import { useState, useEffect, useCallback } from 'react';
import { reportError as logError } from '@/lib/error-handler';

export function useErrorHandler() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const reportError = useCallback((error: any, context: string) => {
    setLastError(error instanceof Error ? error : new Error(String(error)));
    logError(error, context);
  }, []);

  return {
    isOnline,
    lastError,
    reportError,
    clearError: () => setLastError(null),
  };
}
