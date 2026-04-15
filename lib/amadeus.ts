import Amadeus from 'amadeus';

let amadeus: any = null;

export function getAmadeus() {
  if (!amadeus) {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('Amadeus API credentials missing. Flight search will be limited.');
      return null;
    }

    amadeus = new Amadeus({
      clientId,
      clientSecret
    });
  }
  return amadeus;
}

export async function searchFlightOffers(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  adults: number;
}) {
  const client = getAmadeus();
  if (!client) return [];

  try {
    const response = await client.shopping.flightOffersSearch.get(params);
    return response.data;
  } catch (error) {
    console.error('Amadeus Flight Search Error:', error);
    return [];
  }
}
