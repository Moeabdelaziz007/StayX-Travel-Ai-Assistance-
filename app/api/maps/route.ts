import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 });

  // Check Firestore Cache
  const cacheRef = doc(db, 'maps_cache', encodeURIComponent(address));
  const cacheSnap = await getDoc(cacheRef);
  
  if (cacheSnap.exists()) {
    const data = cacheSnap.data();
    if (Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
      return NextResponse.json(data.result);
    }
  }

  // Fetch from Google Maps
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
  const data = await res.json();

  // Save to Cache
  if (data.status === 'OK') {
    await setDoc(cacheRef, {
      result: data,
      timestamp: Date.now()
    });
  }

  return NextResponse.json(data);
}
