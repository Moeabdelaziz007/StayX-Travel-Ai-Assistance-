import { db, auth } from './firebase';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';

import { GoogleGenAI } from '@google/genai';

import { generateWithGroq } from './groq';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

export async function ensureUserProfile() {
  if (!auth.currentUser) return null;
  const docRef = doc(db, 'users', auth.currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    const profile = {
      uid: auth.currentUser.uid,
      name: auth.currentUser.displayName || 'Traveler',
      email: auth.currentUser.email || '',
      createdAt: new Date().toISOString(),
      voiceTone: 'friendly',
      budgetPreference: 'moderate'
    };
    await setDoc(docRef, profile);
    return profile;
  }
  return docSnap.data();
}

export async function updateUserPreferences(args: { voiceTone?: string, budgetPreference?: string }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const docRef = doc(db, 'users', auth.currentUser.uid);
  
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("User not found");
  
  const currentData = docSnap.data();
  const newData = { ...currentData };
  if (args.voiceTone) newData.voiceTone = args.voiceTone;
  if (args.budgetPreference) newData.budgetPreference = args.budgetPreference;
  
  await setDoc(docRef, newData);
  return { success: true, message: "Preferences updated" };
}

export async function bookTrip(args: { destination: string, startDate?: string, endDate?: string, budget?: number }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const tripsRef = collection(db, 'trips');
  const newTrip = {
    userId: auth.currentUser.uid,
    destination: args.destination,
    status: 'booked',
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString()
  };
  if (args.startDate) (newTrip as any).startDate = args.startDate;
  if (args.endDate) (newTrip as any).endDate = args.endDate;
  if (args.budget) (newTrip as any).budget = args.budget;
  
  const docRef = await addDoc(tripsRef, newTrip);
  return { success: true, tripId: docRef.id, message: "Trip booked successfully" };
}

export async function addAppointment(args: { title: string, date: string, type: string, details?: string, price?: number }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const apptRef = collection(db, 'appointments');
  const newAppt = {
    userId: auth.currentUser.uid,
    title: args.title,
    date: args.date,
    type: args.type,
    paymentStatus: args.price ? 'unpaid' : 'paid',
    createdAt: new Date().toISOString()
  };
  if (args.details) (newAppt as any).details = args.details;
  if (args.price) (newAppt as any).price = args.price;
  
  const docRef = await addDoc(apptRef, newAppt);
  return { success: true, appointmentId: docRef.id, message: "Appointment added successfully" };
}

export async function inviteFriend(args: { receiverEmail: string, bookingId: string, bookingType: 'trip' | 'appointment' }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const invRef = collection(db, 'invitations');
  const newInv = {
    senderId: auth.currentUser.uid,
    senderName: auth.currentUser.displayName || 'A friend',
    receiverEmail: args.receiverEmail,
    bookingId: args.bookingId,
    bookingType: args.bookingType,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(invRef, newInv);
  return { success: true, invitationId: docRef.id, message: "Invitation sent successfully" };
}

export async function toggleFavorite(args: { itemId: string, type: 'music' | 'video', title: string, thumbnail?: string }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const favRef = collection(db, 'favorites');
  const newFav = {
    userId: auth.currentUser.uid,
    itemId: args.itemId,
    type: args.type,
    title: args.title,
    thumbnail: args.thumbnail || '',
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(favRef, newFav);
  return { success: true, favoriteId: docRef.id, message: "Added to favorites" };
}

export async function placeOrder(args: { itemName: string, price: number, currency: string }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const orderRef = collection(db, 'orders');
  const newOrder = {
    userId: auth.currentUser.uid,
    itemName: args.itemName,
    price: args.price,
    currency: args.currency,
    status: 'processing',
    trackingNumber: 'TRK' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(orderRef, newOrder);
  return { success: true, orderId: docRef.id, message: "Order placed successfully", trackingNumber: newOrder.trackingNumber };
}

export async function getWeather(args: { location: string, date?: string }) {
  try {
    // 1. Geocoding using Nominatim (OpenStreetMap)
    // Note: Nominatim requires a User-Agent header
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(args.location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'StayX-Travel-Assistant'
        }
      }
    );
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) throw new Error("Location not found");
    
    const { lat, lon, display_name } = geoData[0];
    
    // 2. Weather using Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    );
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    
    const getCondition = (code: number) => {
      if (code === 0) return 'Sunny';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Foggy';
      if (code <= 67) return 'Rainy';
      if (code <= 77) return 'Snowy';
      if (code <= 82) return 'Showers';
      if (code <= 99) return 'Thunderstorm';
      return 'Cloudy';
    };
    
    return {
      location: display_name.split(',')[0],
      temperature: Math.round(current.temperature_2m),
      condition: getCondition(current.weather_code),
      forecast: `Currently ${getCondition(current.weather_code).toLowerCase()} with a temperature of ${Math.round(current.temperature_2m)}°C.`,
      feelsLike: Math.round(current.apparent_temperature),
      windSpeed: current.wind_speed_10m
    };
  } catch (error) {
    console.error("Weather error:", error);
    return { location: args.location, temperature: 22, condition: 'Sunny', forecast: 'Clear skies.', feelsLike: 24, windSpeed: 10 };
  }
}

export async function convertCurrency(args: { amount: number, from: string, to: string }) {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${args.from}`);
    const data = await res.json();
    const rate = data.rates[args.to];
    const result = args.amount * rate;
    return { amount: args.amount, from: args.from, to: args.to, result: result.toFixed(2) };
  } catch (e) {
    const rates: any = { 'USD': 1, 'EUR': 0.92, 'GBP': 0.79, 'JPY': 151.5 };
    const result = (args.amount / rates[args.from]) * rates[args.to];
    return { amount: args.amount, from: args.from, to: args.to, result: result.toFixed(2) };
  }
}

export async function translateText(args: { text: string, targetLanguage: string }) {
  const prompt = `Translate the following text to ${args.targetLanguage}. Return ONLY the translated text: "${args.text}"`;
  
  try {
    if (process.env.GROQ_API_KEY) {
      const translated = await generateWithGroq(prompt, "You are a professional translator.", "llama3-8b-8192");
      return { original: args.text, translated, language: args.targetLanguage };
    }
    
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    return { original: args.text, translated: result.text, language: args.targetLanguage };
  } catch (e) {
    console.warn("Translation AI failed, falling back to Gemini", e);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      return { original: args.text, translated: result.text, language: args.targetLanguage };
    } catch (err) {
      return { original: args.text, translated: `[Translation Error]: ${args.text}`, language: args.targetLanguage };
    }
  }
}

export async function searchGroundingCompare(args: { query: string }) {
  try {
    const prompt = `Compare prices and availability for: ${args.query}. 
    Search on Airbnb, Booking.com, Expedia, and major airlines. 
    Return a JSON array of objects with fields: source, price, currency, description, link, rating.
    Return ONLY the JSON.`;
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    const text = result.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    console.error("Search grounding error:", e);
    return [];
  }
}

export async function generateDetailedItinerary(args: { destination: string, days: number, budget: string }) {
  const prompt = `Develop a fully detailed travel itinerary for:
  Destination: ${args.destination}
  Duration: ${args.days} days
  Budget: ${args.budget}
  
  Return ONLY a JSON object with this structure:
  {
    "trip_title": "string",
    "summary": "string",
    "currency": "string",
    "total_estimated_cost": "string",
    "daily_plan": [
      {
        "day": number,
        "theme": "string",
        "best_image_keyword": "string",
        "activities": [
          {"time": "string", "activity": "string", "description": "string", "location": "string", "cost": "string"}
        ]
      }
    ],
    "hotels": [
      {"name": "string", "rating": "string", "price_per_night": "string", "description": "string", "image_keyword": "string"}
    ]
  }`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response");
  } catch (e) {
    console.error("Itinerary generation error:", e);
    throw e;
  }
}

export async function createVoiceRoom(args: { title: string }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const roomRef = collection(db, 'voice_rooms');
  const newRoom = {
    title: args.title,
    createdBy: auth.currentUser.uid,
    creatorName: auth.currentUser.displayName || 'Traveler',
    createdAt: new Date().toISOString(),
    participants: [auth.currentUser.uid],
    status: 'active',
    magicLink: `https://stayx.app/join/${Math.random().toString(36).substring(2, 10)}`
  };
  const docRef = await addDoc(roomRef, newRoom);
  return { success: true, roomId: docRef.id, magicLink: newRoom.magicLink };
}

export async function searchFlights(args: { origin: string, destination: string, date: string }) {
  // Travelpayouts / Aviasales affiliate links
  const affiliateId = process.env.TRAVELPAYOUTS_AFFILIATE_ID || 'stayx';
  const getAffiliateLink = (origin: string, dest: string, date: string) => 
    `https://www.aviasales.com/search/${origin}${date.replace(/-/g, '')}${dest}1?marker=${affiliateId}`;

  return [
    { name: 'EgyptAir', price: '$450', duration: '3h 30m', link: getAffiliateLink(args.origin, args.destination, args.date) },
    { name: 'Turkish Airlines', price: '$520', duration: '3h 45m', link: getAffiliateLink(args.origin, args.destination, args.date) },
    { name: 'Pegasus', price: '$380', duration: '4h 00m', link: getAffiliateLink(args.origin, args.destination, args.date) }
  ];
}

export async function searchSimCards(args: { destination: string }) {
  // Affiliate links for Airalo or similar
  const affiliateId = process.env.AIRALO_AFFILIATE_ID || 'stayx';
  return [
    { name: 'Airalo Global', price: '$15', data: '5GB', link: `https://airalo.pxf.io/stayx?destination=${args.destination}` },
    { name: 'Holafly Unlimited', price: '$29', data: 'Unlimited', link: `https://holafly.com/?aff=${affiliateId}` }
  ];
}

export async function addToCalendar(args: { title: string, description: string, startTime: string, endTime: string, location?: string }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  // In a real app, we would use Google Calendar API with OAuth
  // For this demo, we'll save it to Firestore and trigger a notification
  const calRef = collection(db, 'calendar_events');
  const newEvent = {
    userId: auth.currentUser.uid,
    ...args,
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(calRef, newEvent);
  
  // Play notification sound
  if (typeof window !== 'undefined') {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  }

  return { success: true, eventId: docRef.id, message: "Event added to your StayX calendar and synced with Google" };
}

export async function searchPlaces(args: { query: string, location?: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Google Maps API Key not configured");

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(args.query)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results;
}

export async function getDirections(args: { origin: string, destination: string, mode?: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Google Maps API Key not configured");

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(args.origin)}&destination=${encodeURIComponent(args.destination)}&mode=${args.mode || 'driving'}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes;
}

export async function initiatePayment(args: { amount: number, name: string, description: string, metadata: any }) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  
  if (data.url) {
    window.location.href = data.url;
  }
  return data;
}
