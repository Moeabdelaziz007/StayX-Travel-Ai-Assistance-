import { db, auth } from './firebase';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { generateWithGroq } from './groq';
import { getCache, setCache } from './cache';
import { searchFlightOffers } from './amadeus';

let _aiClient: any = null;

const getAiClient = () => {
  if (!_aiClient) {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
      console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
    }
    _aiClient = new GoogleGenAI({ apiKey: key || '' });
  }
  return _aiClient;
};

export const aiGenerate = async (prompt: string, config: any = {}) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: config.model || "gemini-3-flash-preview",
      contents: prompt,
      config: config.config || {}
    });
    return { text: response.text };
  } catch (error: any) {
    if (error?.message?.includes("429 RESOURCE_EXHAUSTED")) {
      console.warn("Quota exceeded for requested model. Falling back to smaller model.");
      if (config.model !== "gemini-3-flash-preview") {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: config.config || {}
        });
        return { text: response.text };
      }
      throw new Error("AI is currently overloaded due to high demand. Please try again in a few minutes.");
    }
    throw error;
  }
};

const fetchJson = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Expected JSON but got ${contentType || 'unknown'}: ${text.substring(0, 100)}...`);
  }
  return response.json();
};

const safeJsonParse = (text: string, fallback: any = []) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON parse error:', e, 'Text:', text);
    return fallback;
  }
};

// Caching durations (hours)
const TTL_FLIGHTS = 6;
const TTL_HOTELS = 12;
const TTL_WEATHER = 1;
const TTL_SIM = 12;

export async function getVisaInfo(nationality: string, destination: string) {
  const cacheKey = `visa_${nationality}_${destination}`.toLowerCase();
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  const prompt = `Provide the current tourist visa requirements for a citizen of ${nationality} traveling to ${destination}. Provide accurate and up-to-date information. Return as JSON: { requiresVisa: boolean, visaType: string, summary: string, duration: string, estimatedCost: string, link: string }`;
  const result = await aiGenerate(prompt, {
    model: "gemini-3-flash-preview",
    config: {
      responseMimeType: "application/json"
    }
  });
  
  const data = safeJsonParse(result.text, {});
  await setCache(cacheKey, data, 24); 
  return data;
}

export async function getCityGuide(city: string) {
  try {
    const res = await fetch(`https://en.wikivoyage.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&origin=*&titles=${encodeURIComponent(city)}`);
    const data = await fetchJson<any>(res);
    const pages = data?.query?.pages;
    if (!pages) return null;
    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") return null;
    return pages[pageId].extract;
  } catch (error) {
    console.error("Wikivoyage error:", error);
    return null;
  }
}

export async function getLiveHotelPrices(destination: string, dates: string) {
  try {
    const ai = getAiClient();
    const prompt = `Use Google Search to find current average nightly prices for Airbnb and Booking.com for ${destination} around ${dates}. Return a helpful short summary (max 3 sentences) of the expected price range per night in USD. Include explicit mentions of Booking and Airbnb findings if available. Keep formatting simple.`;
    
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] as any
      }
    });
    return result.text;
  } catch (error) {
    console.error("Hotel Price Grounding error:", error);
    return "Could not fetch live pricing at this time.";
  }
}



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
  const cacheKey = `weather_${args.location}`.toLowerCase();
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(args.location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'StayX-Travel-Assistant'
        }
      }
    );
    const geoData = await fetchJson<any>(geoRes);
    if (!geoData || geoData.length === 0) throw new Error("Location not found");
    
    const { lat, lon, display_name } = geoData[0];
    
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    );
    const weatherData = await fetchJson<any>(weatherRes);
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
    
    const result = {
      location: display_name.split(',')[0],
      temperature: Math.round(current.temperature_2m),
      condition: getCondition(current.weather_code),
      forecast: `Currently ${getCondition(current.weather_code).toLowerCase()} with a temperature of ${Math.round(current.temperature_2m)}°C.`,
      feelsLike: Math.round(current.apparent_temperature),
      windSpeed: current.wind_speed_10m
    };

    await setCache(cacheKey, result, TTL_WEATHER);
    return result;
  } catch (error) {
    console.error("Weather error:", error);
    return { location: args.location, temperature: 22, condition: 'Sunny', forecast: 'Clear skies.', feelsLike: 24, windSpeed: 10 };
  }
}

export async function convertCurrency(args: { amount: number, from: string, to: string }) {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${args.from}`);
    if (!res.ok) throw new Error(`Currency API failed: ${res.status}`);
    const data = await fetchJson<any>(res);
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
    
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    return { original: args.text, translated: result.text, language: args.targetLanguage };
  } catch (e) {
    console.warn("Translation AI failed, falling back to Gemini", e);
    try {
      const ai = getAiClient();
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

export async function getSmartAutocomplete(partial: string) {
  if (!partial || partial.length < 2) return [];
  const prompt = `Based on this partial travel search: "${partial}", suggest 3 highly specific and creative travel search queries. 
  Example: "Bali" -> "Bali in January with 3 people on a medium budget". 
  Return ONLY a JSON array of strings.`;
  
  try {
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    const text = result.text || '';
    const jsonMatch = text.match(/\[.*\]/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (e) {
    return [];
  }
}

export async function visualSearchDestination(base64Image: string) {
  const ai = getAiClient();
  const prompt = `Act as an expert travel guide. Analyze this image to identify the specific travel destination, landmark, city, or site shown. 
  - If a specific landmark is present (e.g., Eiffel Tower, Great Wall), provide its exact name and city.
  - If it's a generic but distinct scene (e.g., a specific style of beach hut or mountain range), identify the most famous location it likely represents (e.g., "Maldives", "Swiss Alps").
  - Look for cultural clues, local architecture, or unique natural features.
  - Return ONLY the name of the place, formatted as "Landmark, City" or "City, Country" or just "Place Name". 
  Return ONLY the text name.`;
  
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: "image/jpeg"
          }
        }
      ]
    });
    return result.text?.trim() || "Unknown Destination";
  } catch (e) {
    console.error("Visual search error:", e);
    throw new Error("Could not identify image");
  }
}

export async function searchGroundingCompare(args: { query: string }) {
  try {
    const prompt = `Act as a travel expert. Enhance this search intent: "${args.query}". 
    Then, compare prices and availability for the resulting specific trip. 
    Search on Airbnb, Booking.com, Expedia, and major airlines. 
    Return a JSON array of objects with fields: source, price, currency, description, link, rating.
    Ensure descriptions are catchy and helpful.
    Return ONLY the JSON.`;
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] as any
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
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
  const cacheKey = `flights_${args.origin}_${args.destination}_${args.date}`.toLowerCase();
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const affiliateId = process.env.TRAVELPAYOUTS_AFFILIATE_ID || 'stayx';
    const tpToken = process.env.TRAVELPAYOUTS_TOKEN;

    const tpSearch = async () => {
      if (!tpToken) return [];
      try {
        const res = await fetch(`https://api.travelpayouts.com/v3/prices_for_dates?origin=${args.origin}&destination=${args.destination}&departure_at=${args.date}&unique=true&token=${tpToken}`);
        const data = await fetchJson<any>(res);
        return (data.data || []).map((f: any) => ({
          name: f.airline || 'Airline',
          price: `$${f.price}`,
          duration: 'Multiple stops',
          link: `https://www.aviasales.com/search/${args.origin}${args.date.replace(/-/g, '')}${args.destination}1?marker=${affiliateId}`
        }));
      } catch (e) { return []; }
    };

    const amadeusSearch = async () => {
      if (args.origin.length === 3 && args.destination.length === 3) {
        return searchFlightOffers({
          originLocationCode: args.origin.toUpperCase(),
          destinationLocationCode: args.destination.toUpperCase(),
          departureDate: args.date,
          adults: 1
        });
      }
      return [];
    };

    const results = await Promise.allSettled([tpSearch(), amadeusSearch()]);
    const merged = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value);

    if (merged.length > 0) {
      await setCache(cacheKey, merged, TTL_FLIGHTS);
      return merged;
    }

    const fallbackLink = `https://www.aviasales.com/search/${args.origin}${args.date.replace(/-/g, '')}${args.destination}1?marker=${affiliateId}`;
    const fallback = [
      { name: 'Flight Estimate', price: 'from $300', duration: 'Variable', link: fallbackLink }
    ];
    return fallback;
  } catch (e) {
    console.error("Flight search error:", e);
    return [];
  }
}

export async function searchSimCards(args: { destination: string }) {
  const cacheKey = `sim_${args.destination}`.toLowerCase();
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `Find current real-time eSIM prices for ${args.destination}. Search on Airalo and Holafly. Return a JSON array of objects with fields: name, price (USD), data, link. Return ONLY JSON.`;
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] as any
      }
    });
    const text = result.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    let sims = match ? JSON.parse(match[0]) : [];

    if (sims.length === 0) {
      const affiliateId = process.env.AIRALO_AFFILIATE_ID || 'stayx';
      sims = [
        { name: 'Airalo Global', price: '$15', data: '5GB', link: `https://airalo.pxf.io/stayx?destination=${args.destination}` },
        { name: 'Holafly Unlimited', price: '$29', data: 'Unlimited', link: `https://holafly.com/?aff=${affiliateId}` }
      ];
    }
    await setCache(cacheKey, sims, TTL_SIM);
    return sims;
  } catch (e) {
    return [];
  }
}

export async function addToCalendar(args: { title: string, description: string, startTime: string, endTime: string, location?: string, accessToken?: string }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  let googleEvent = null;
  if (args.accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${args.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: args.title,
          description: args.description,
          start: { dateTime: args.startTime },
          end: { dateTime: args.endTime },
          location: args.location
        })
      });
      googleEvent = await response.json();
    } catch (e) {
      console.error("Failed to sync with Google Calendar", e);
    }
  }

  const calRef = collection(db, 'calendar_events');
  const newEvent = {
    userId: auth.currentUser.uid,
    ...args,
    googleEventId: googleEvent?.id || null,
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(calRef, newEvent);
  
  // Play notification sound
  if (typeof window !== 'undefined') {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  }

  return { 
    success: true, 
    eventId: docRef.id, 
    synced: !!googleEvent,
    message: googleEvent ? "Event synced with Google Calendar!" : "Event saved to StayX calendar."
  };
}

export async function searchHotels(args: { destination: string, checkIn: string, checkOut: string }) {
  const cacheKey = `hotels_${args.destination}_${args.checkIn}`.toLowerCase();
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const affiliateId = process.env.TRAVELPAYOUTS_AFFILIATE_ID || 'stayx';
    
    const hotelSearch = async () => {
      try {
        const res = await fetch(`https://engine.hotellook.com/api/v2/cache.json?location=${encodeURIComponent(args.destination)}&checkIn=${args.checkIn}&checkOut=${args.checkOut}&currency=usd&limit=5`);
        const data = await fetchJson<any>(res);
        return (data || []).map((h: any) => ({
          name: h.hotelName || 'Comfort Stay',
          price: `$${h.priceAvg}/night`,
          rating: h.stars || 4.0,
          image: `https://photo.hotellook.com/image_v2/limit/${h.hotelId}/800/600.jpg`,
          link: `https://search.hotellook.com/?location=${encodeURIComponent(args.destination)}&checkIn=${args.checkIn}&checkOut=${args.checkOut}&marker=${affiliateId}`
        }));
      } catch (e) { return []; }
    };

    const groundingSearch = async () => {
      try {
        const prompt = `Find 2 luxury hotels in ${args.destination} for ${args.checkIn} to ${args.checkOut}. Return JSON array: name, price, rating, link.`;
        const ai = getAiClient();
        const res = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }] as any
          }
        });
        const match = res.text?.match(/\[[\s\S]*\]/);
        return match ? JSON.parse(match[0]) : [];
      } catch (e) { return []; }
    };

    const results = await Promise.allSettled([hotelSearch(), groundingSearch()]);
    const merged = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value)
      .slice(0, 6);

    await setCache(cacheKey, merged, TTL_HOTELS);
    return merged;
  } catch (e) {
    console.error("Hotel search error:", e);
    return [];
  }
}

export async function generateDestinationImage(args: { prompt: string }) {
  const seed = Math.floor(Math.random() * 1000000);
  const apiKey = process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY;
  const baseUrl = "https://pollinations.ai/p/";
  const params = new URLSearchParams({
    width: "1024",
    height: "1024",
    seed: seed.toString(),
    model: "flux",
    nologo: "true"
  });
  
  if (apiKey) {
    params.set("api_key", apiKey);
  }

  const imageUrl = `${baseUrl}${encodeURIComponent(args.prompt)}?${params.toString()}`;
  return { imageUrl, message: "Image generated successfully using Pollinations AI" };
}

export async function getCountryInfo(args: { countryName: string }) {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(args.countryName)}?fullText=true`);
    const data = await fetchJson<any>(res);
    if (!data || data.length === 0) throw new Error("Country not found");
    
    const country = data[0];
    return {
      name: country.name.common,
      officialName: country.name.official,
      capital: country.capital?.[0],
      region: country.region,
      subregion: country.subregion,
      population: country.population,
      currencies: Object.values(country.currencies || {}).map((c: any) => `${c.name} (${c.symbol})`).join(', '),
      languages: Object.values(country.languages || {}).join(', '),
      flag: country.flags.svg,
      map: country.maps.googleMaps
    };
  } catch (error) {
    console.error("RestCountries error:", error);
    throw error;
  }
}

export async function searchPlaces(args: { query: string, location?: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Google Maps API Key not configured");

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(args.query)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await fetchJson<any>(res);
  return data.results;
}

export async function getDirections(args: { origin: string, destination: string, mode?: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Google Maps API Key not configured");

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(args.origin)}&destination=${encodeURIComponent(args.destination)}&mode=${args.mode || 'driving'}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await fetchJson<any>(res);
  return data.routes;
}

export async function initiatePayment(args: { amount: number, name: string, description: string, metadata: any }) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  
  const data = await fetchJson<any>(response);
  if (data.error) throw new Error(data.error);
  
  if (data.url) {
    window.location.href = data.url;
  }
  return data;
}
