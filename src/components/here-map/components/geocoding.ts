import { HERE_GEOCODE_API } from "../constants/constants";
import type { GeocodingResult, HereGeocodeItem } from "../types/types";

// HERE Autosuggest endpoint — returns POIs, malls, streets, addresses, landmarks
const HERE_AUTOSUGGEST_API = "https://autosuggest.search.hereapi.com/v1/autosuggest";
const HERE_DISCOVER_API    = "https://discover.search.hereapi.com/v1/discover";

// ─────────────────────────────────────────────────────────────────────────────
// HERE Geocoding REST client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Autosuggest — covers POIs (malls, restaurants, landmarks), streets, national
 * addresses, and free-form text. Biased toward `center` coordinates when given.
 * Falls back to HERE Discover if Autosuggest returns nothing.
 */
export async function autosuggestQuery(
  query: string,
  apiKey: string,
  center: { lat: number; lng: number } = { lat: 24.7136, lng: 46.6753 },
  maxResults = 8,
): Promise<GeocodingResult[]> {
  // Build Autosuggest request
  const url = new URL(HERE_AUTOSUGGEST_API);
  url.searchParams.set("q",      query);
  url.searchParams.set("at",     `${center.lat},${center.lng}`);
  url.searchParams.set("limit",  String(maxResults));
  url.searchParams.set("lang",   "ar,en");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`خطأ في البحث: ${res.status}`);

  const payload = await res.json();

  // Autosuggest items may be: place, street, locality, chainQuery, categoryQuery, etc.
  // Only keep items that carry a position.
  const items: GeocodingResult[] = (payload.items ?? [])
    .filter((item: HereGeocodeItem & { position?: { lat: number; lng: number } }) =>
      item.position?.lat !== undefined,
    )
    .map((item: HereGeocodeItem & { position: { lat: number; lng: number } }) => ({
      title:     item.title,
      latitude:  item.position.lat,
      longitude: item.position.lng,
    }));

  if (items.length > 0) return items;

  // Fallback: Discover (broader keyword search) if Autosuggest had no positional results
  return discoverQuery(query, apiKey, center, maxResults);
}

/**
 * Discover — full-text keyword search biased to a geographic area.
 * Good fallback for queries that return zero Autosuggest positional results.
 */
export async function discoverQuery(
  query: string,
  apiKey: string,
  center: { lat: number; lng: number } = { lat: 24.7136, lng: 46.6753 },
  maxResults = 8,
): Promise<GeocodingResult[]> {
  const url = new URL(HERE_DISCOVER_API);
  url.searchParams.set("q",      query);
  url.searchParams.set("at",     `${center.lat},${center.lng}`);
  url.searchParams.set("limit",  String(maxResults));
  url.searchParams.set("lang",   "ar,en");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`خطأ في البحث: ${res.status}`);

  const payload = await res.json();
  return (payload.items ?? [])
    .filter((item: HereGeocodeItem) => item.position?.lat !== undefined)
    .map((item: HereGeocodeItem) => ({
      title:     item.title,
      latitude:  item.position.lat,
      longitude: item.position.lng,
    }));
}

/**
 * Geocode — strict address / national-address lookup (original endpoint).
 * Kept for backwards compatibility.
 */
export async function geocodeQuery(
  query: string,
  apiKey: string,
  maxResults = 5,
): Promise<GeocodingResult[]> {
  const url = new URL(HERE_GEOCODE_API);
  url.searchParams.set("q",      query);
  url.searchParams.set("limit",  String(maxResults));
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`خطأ في البحث: ${response.status}`);

  const payload = await response.json();
  return (payload.items ?? []).map((item: HereGeocodeItem) => ({
    title:     item.title,
    latitude:  item.position.lat,
    longitude: item.position.lng,
  }));
}
