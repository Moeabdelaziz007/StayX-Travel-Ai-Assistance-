export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`Fetch failed with status ${response.status}: ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn(`Expected JSON but got ${contentType || 'unknown'} from ${url}. Body: ${text.substring(0, 100)}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`SafeFetch error for ${url}:`, error);
    return null;
  }
}
