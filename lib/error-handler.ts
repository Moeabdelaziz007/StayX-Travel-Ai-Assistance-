import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Local state for DebugPanel
export const debugStats = {
  apiCalls: 0,
  recentErrors: [] as any[],
};

export function reportError(error: any, context: string) {
  const user = auth.currentUser;
  const errorData = {
    timestamp: new Date().toISOString(),
    userId: user?.uid || 'anonymous',
    context,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : null,
    url: typeof window !== 'undefined' ? window.location.href : 'server-side',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side',
  };

  debugStats.recentErrors = [errorData, ...debugStats.recentErrors].slice(0, 50);
  console.error(`[StayX Error Report] ${context}:`, errorData);

  // Background logging to Firestore
  if (db) {
    addDoc(collection(db, 'error_logs'), errorData).catch((err) => {
      console.error('Failed to log error to Firestore:', err);
    });
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      debugStats.apiCalls++;
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number = 10000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    ),
  ]);
}
