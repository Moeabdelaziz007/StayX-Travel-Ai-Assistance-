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

export async function searchHotelOffers(params: {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
}) {
  const client = getAmadeus();
  if (!client) return [];

  try {
    // Amadeus Hotel Search v3
    const response = await client.referenceData.locations.hotels.byCity.get({
      cityCode: params.cityCode
    });
    
    const hotelIds = response.data.slice(0, 10).map((h: any) => h.hotelId).join(',');
    
    if (!hotelIds) return [];

    const offersResponse = await client.shopping.hotelOffersSearch.get({
      hotelIds,
      adults: params.adults,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate
    });

    return offersResponse.data.map((offer: any) => ({
      name: offer.hotel.name,
      price: `$${offer.offers[0].price.total}/night`,
      rating: 4.0, // Amadeus doesn't always provide simple star ratings in this endpoint
      image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800&h=600`, // Placeholder
      link: 'https://www.amadeus.com'
    }));
  } catch (error) {
    console.error('Amadeus Hotel Search Error:', error);
    return [];
  }
}
