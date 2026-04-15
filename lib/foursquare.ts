export async function searchPlacesFoursquare(params: {
  query: string;
  near?: string;
  ll?: string;
  categories?: string;
  limit?: number;
}) {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    console.warn('Foursquare API key missing.');
    return [];
  }

  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append('query', params.query);
  if (params.near) searchParams.append('near', params.near);
  if (params.ll) searchParams.append('ll', params.ll);
  if (params.categories) searchParams.append('categories', params.categories);
  searchParams.append('limit', String(params.limit || 10));
  searchParams.append('fields', 'fsq_id,name,location,photos,rating,price,description,tel,website,hours');

  try {
    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: apiKey,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Foursquare Search Error:', error);
    return [];
  }
}
