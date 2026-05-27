import {
  OPENWEATHER_API_KEY_REVERSE,
  OPENWEATHER_GEO_BASE_URL,
} from '../../../libs/common/constants/externalApis';

// reverse-geocode.ts
const FALLBACK_LABEL = 'Bilinmeyen konum';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat
const ERROR_CACHE_TTL_MS = 5 * 60 * 1000; // hata durumunda kısa süreliğine tekrar etme
const MAX_CACHE_ENTRIES = 20;

type CacheEntry = {
  label: string;
  expiresAt: number;
};

const reverseGeocodeCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<string>>();

function toCacheKey(latitude: number, longitude: number) {
  const precision = 3; // ~100m hassasiyet
  return `${latitude.toFixed(precision)},${longitude.toFixed(precision)}`;
}

function getCachedLabel(key: string) {
  const entry = reverseGeocodeCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt < Date.now()) {
    reverseGeocodeCache.delete(key);
    return null;
  }
  return entry.label;
}

function setCache(key: string, label: string, ttlMs = CACHE_TTL_MS) {
  if (reverseGeocodeCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = reverseGeocodeCache.keys().next().value;
    if (oldestKey) {
      reverseGeocodeCache.delete(oldestKey);
    }
  }
  reverseGeocodeCache.set(key, {
    label,
    expiresAt: Date.now() + ttlMs,
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  if (!OPENWEATHER_API_KEY_REVERSE) {
    return FALLBACK_LABEL;
  }

  const cacheKey = toCacheKey(latitude, longitude);
  const cachedLabel = getCachedLabel(cacheKey);
  if (cachedLabel) {
    return cachedLabel;
  }

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)!;
  }

  const requestPromise = fetchReverseGeocode(
    latitude,
    longitude,
    cacheKey,
  ).finally(() => {
    inflightRequests.delete(cacheKey);
  });
  inflightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

type OWMReverseItem = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

async function fetchReverseGeocode(
  latitude: number,
  longitude: number,
  cacheKey: string,
): Promise<string> {
  const url = `${OPENWEATHER_GEO_BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_API_KEY_REVERSE}`;
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `OpenWeather reverse geocode failed. Status: ${res.status}`,
      );
    }

    const json = (await res.json()) as OWMReverseItem[];

    if (!Array.isArray(json) || json.length === 0) {
      setCache(cacheKey, FALLBACK_LABEL, ERROR_CACHE_TTL_MS);
      return FALLBACK_LABEL;
    }

    const item = json[0];

    // Yerel isim varsa önce onu kullan (tr sonra en)
    const localName =
      item.local_names?.tr || item.local_names?.en || item.name;

    const city = normalize(localName);
    const state = normalize(item.state);

    // Şehir ve eyalet aynıysa tekrar etme
    const parts =
      city && state && city.toLowerCase() !== state.toLowerCase()
        ? [city, state]
        : [city || state];

    const result = parts.filter(Boolean).join(', ') || FALLBACK_LABEL;
    setCache(cacheKey, result);
    return result;
  } catch {
    setCache(cacheKey, FALLBACK_LABEL, ERROR_CACHE_TTL_MS);
    return FALLBACK_LABEL;
  }
}

function normalize(str?: string): string | undefined {
  if (!str) return undefined;
  const s = str.trim();
  if (!s) return undefined;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getUTCLabel(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${offset}`;
}
