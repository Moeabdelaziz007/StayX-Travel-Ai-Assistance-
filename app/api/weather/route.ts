import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Helper to add delay for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  try {
    // 1. Geocode with Nominatim (with delay)
    await delay(1000);
    const geoRes = await fetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'StayX-Travel-Assistant' }
      }
    );
    const geoData = await geoRes.json();
    
    if (!geoData || geoData.length === 0) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const { lat, lon, display_name } = geoData[0];

    // 2. Fetch Weather
    const weatherRes = await fetch(
      `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    return NextResponse.json({
      location: display_name,
      current: weatherData.current,
      daily: weatherData.daily
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
