import { NextResponse } from 'next/server';
import { searchFlightOffers } from '@/lib/amadeus';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');

    if (!origin || !destination || !date) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const flights = await searchFlightOffers({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: 1
    });

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Amadeus Flights API Error:', error);
    return NextResponse.json({ error: 'Failed to search flights' }, { status: 500 });
  }
}
