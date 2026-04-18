import { NextResponse } from 'next/server';
import { searchHotelOffers } from '@/lib/amadeus';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');

    if (!destination || !date) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Default 3 day stay if checkOut not provided
    const checkIn = date;
    const checkOut = new Date(new Date(date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const hotels = await searchHotelOffers({
      cityCode: destination.toUpperCase(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: 1
    });

    return NextResponse.json(hotels);
  } catch (error) {
    console.error('Amadeus Hotels API Error:', error);
    return NextResponse.json({ error: 'Failed to search hotels' }, { status: 500 });
  }
}
