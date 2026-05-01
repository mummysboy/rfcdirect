/**
 * Mapbox geocoding helpers — forward geocoding (text → lng/lat) for the
 * search input on the home screen. Per UX.md: debounced 300ms, up to 5
 * suggestions, in-memory cached for the session.
 */

export type GeocodeResult = {
  placeName: string;
  longitude: number;
  latitude: number;
};

const ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const SUGGESTION_LIMIT = 5;

const cache = new Map<string, GeocodeResult[]>();

function getToken(): string {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error('Missing EXPO_PUBLIC_MAPBOX_TOKEN.');
  }
  return token;
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cached = cache.get(trimmed);
  if (cached) return cached;

  const url = `${ENDPOINT}/${encodeURIComponent(trimmed)}.json?access_token=${getToken()}&limit=${SUGGESTION_LIMIT}&types=place,address,postcode,locality,neighborhood`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox geocoding failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    features: { place_name: string; center: [number, number] }[];
  };
  const results: GeocodeResult[] = json.features.map((f) => ({
    placeName: f.place_name,
    longitude: f.center[0],
    latitude: f.center[1],
  }));

  cache.set(trimmed, results);
  return results;
}

/**
 * Universal Google Maps "search" URL — opens the address in the Google Maps
 * app on iOS/Android and the web map elsewhere. Address-query (rather than
 * lat/lng) lands at the named place, which is what users expect when tapping
 * a "Practice location" row.
 */
export function googleMapsUrlFor(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Tiny debounce helper. Per UX.md, geocoding requests debounce 300ms. */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
