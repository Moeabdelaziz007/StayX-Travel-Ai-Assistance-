import { db } from './firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cacheRef = doc(db, 'api_cache', key);
    const snap = await getDoc(cacheRef);
    
    if (snap.exists()) {
      const data = snap.data();
      const now = Date.now();
      const expires = data.expiresAt.toMillis();
      
      if (now < expires) {
        return data.value as T;
      }
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

export async function setCache(key: string, value: any, ttlHours: number) {
  try {
    const cacheRef = doc(db, 'api_cache', key);
    const expiresAt = Timestamp.fromMillis(Date.now() + ttlHours * 60 * 60 * 1000);
    
    await setDoc(cacheRef, {
      value,
      expiresAt,
      updatedAt: Timestamp.now()
    });
  } catch (e) {
    console.error('Cache write error:', e);
  }
}
