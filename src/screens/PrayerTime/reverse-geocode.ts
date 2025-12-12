import {
  LOCATIONIQ_API_KEY,
  LOCATIONIQ_BASE_URL,
} from '../../../libs/common/constants/externalApis';

// reverse-geocode.ts
export type PlaceParts = {
  city?: string;
  state?: string;
  county?: string;
  town?: string;
  village?: string;
  district?: string;
  suburb?: string;
  country_code?: string;
};

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
  if (!LOCATIONIQ_API_KEY) {
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

async function fetchReverseGeocode(
  latitude: number,
  longitude: number,
  cacheKey: string,
): Promise<string> {
  const url = `${LOCATIONIQ_BASE_URL}/reverse?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&normalizeaddress=1&addressdetails=1&accept-language=tr,en`;
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `LocationIQ reverse geocode failed. Status: ${res.status}`,
      );
    }

    const json = await res.json();

    const a = json?.address || {};

    // 1️⃣ City-level alan
    const cityLike =
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.suburb ||
      a.hamlet ||
      a.locality ||
      a.county ||
      a.state_district;

    // 2️⃣ Üst idari alan (state / province / region sıralı)
    let adminLike = a.state || a.province || a.region || a.county || undefined;

    // 3️⃣ Çok geniş bölgeleri filtrele (Region, Bölgesi, Area, Zone vs.)
    if (adminLike && /(region|bölgesi|area|zone)/i.test(adminLike)) {
      adminLike = a.state || a.province || undefined;
    }

    // 4️⃣ Normalize ve tekrar kontrol
    let city = normalize(cityLike);
    let admin = normalize(adminLike);

    if (city && admin && city.toLowerCase() === admin.toLowerCase()) {
      admin = undefined;
    }

    // 5️⃣ Fallback — hiçbir şey yoksa ülkeyi kullan
    if (!city && !admin && a.country) {
      city = a.country;
    }

    const parts = [city, admin].filter(Boolean);
    const result = parts.length ? parts.join(', ') : FALLBACK_LABEL;
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
