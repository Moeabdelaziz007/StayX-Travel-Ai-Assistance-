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
    const response = await client.shopping.flightOffersSearch.get({
      ...params,
      max: 5
    });
    
    // Map Amadeus response to StayX format
    return response.data.map((offer: any) => ({
      name: offer.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Airline',
      price: `$${offer.price.total}`,
      duration: offer.itineraries?.[0]?.duration?.replace('PT', '').toLowerCase() || 'N/A',
      link: 'https://www.amadeus.com' // Free tier doesn't always provide direct booking links, so we point to general or handled in UI
    }));
  } catch (error) {
    console.error('Amadeus Flight Search Error:', error);
    return [];
  }
}
