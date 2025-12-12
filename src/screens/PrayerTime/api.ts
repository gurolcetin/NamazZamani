import { getTimeZoneByCoords } from '../../../libs/core/helpers';
import { PrayerTimeMethodOption } from '../../../libs/common/types';
import i18next from 'i18next';

export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
};

const METHODS_ENDPOINT = 'https://api.aladhan.com/v1/methods';

const haversineDistanceKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
};

const fetchWithHttpFallback = async (url: string) => {
  try {
    return await fetch(url);
  } catch (err) {
    if (url.startsWith('https://')) {
      const insecureUrl = url.replace('https://', 'http://');
      console.warn(
        '[prayer-times] HTTPS fetch failed, retrying over HTTP fallback.',
        err,
      );
      try {
        return await fetch(insecureUrl);
      } catch (fallbackError) {
        console.warn(
          '[prayer-times] HTTP fallback also failed.',
          fallbackError,
        );
        throw fallbackError;
      }
    }
    throw err;
  }
};

export async function fetchPrayerTimeMethods(): Promise<
  PrayerTimeMethodOption[]
> {
  try {
    const res = await fetchWithHttpFallback(METHODS_ENDPOINT);
    const json = await res.json();
    if (json?.code !== 200 || !json?.data) {
      throw new Error('METHODS_FETCH_FAILED');
    }
    const entries = Object.values(json.data) as any[];
    return entries
      .map(item => {
        const hasLatitude =
          item?.location && typeof item.location.latitude === 'number';
        const hasLongitude =
          item?.location && typeof item.location.longitude === 'number';
        return {
          id: typeof item?.id === 'number' ? item.id : Number(item?.id),
          name: item?.name ?? '',
          latitude: hasLatitude ? item.location.latitude : null,
          longitude: hasLongitude ? item.location.longitude : null,
        } as PrayerTimeMethodOption;
      })
      .filter(item => Number.isFinite(item.id) && item.name);
  } catch (err) {
    console.warn('[prayer-times] Failed to fetch prayer time methods', err);
    throw err;
  }
}

export const findClosestPrayerMethod = (
  methods: PrayerTimeMethodOption[],
  latitude: number,
  longitude: number,
): PrayerTimeMethodOption | null => {
  if (!methods?.length) {
    return null;
  }
  let winner: PrayerTimeMethodOption | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const method of methods) {
    if (
      typeof method.latitude !== 'number' ||
      typeof method.longitude !== 'number'
    ) {
      continue;
    }
    const distance = haversineDistanceKm(
      { latitude, longitude },
      { latitude: method.latitude, longitude: method.longitude },
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      winner = method;
    }
  }
  return winner;
};

export async function fetchPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  baseDate: Date = new Date(), // cihazın o anki tarihi (veya geçilecek tarih)
  methodId = 13,
): Promise<PrayerTimings> {
  let tzString = 'Europe/Istanbul';
  try {
    tzString = getTimeZoneByCoords(latitude, longitude); // örn: "Europe/Istanbul"
  } catch (err) {
    console.warn('Fallback to default timezone', err);
  }

  // Cihaz tarihine göre - saniye cinsinden timestamp
  const ts = Math.floor(baseDate.getTime() / 1000);
  // O güne ait vakitler
  const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${latitude}&longitude=${longitude}&method=${methodId}&timezonestring=${encodeURIComponent(
    tzString,
  )}`;
  const makeNetworkError = (cause?: unknown) => {
    const err: any = new Error('PRAYER_TIMES_NETWORK_ERROR');
    err.prayerTimesCode = 'NETWORK_OR_DEVICE_DATE';
    err.cause = cause;
    return err;
  };
  try {
    const res = await fetchWithHttpFallback(url);
    const json = await res.json();
    if (json?.code !== 200) {
      throw new Error(json?.data || i18next.t('errors.prayerTimesFetchFailed'));
    }
    return json.data.timings as PrayerTimings;
  } catch (err) {
    throw makeNetworkError(err);
  }
}
