import i18next from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTimeZoneByCoords } from '../../../../libs/core/helpers';

export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
};

// Basit bellek cache’i: "YYYY-MM@lat,lon" -> gün[] (1-indexed)
const monthCache = new Map<string, PrayerTimings[]>();
const STORAGE_PREFIX = 'prayerTimes:month:v1';

type StoredMonthCache = {
  data: PrayerTimings[];
  fetchedAt: string;
  cacheLabel?: string;
};

function getDeviceTimeZone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'
    );
  } catch {
    return 'Europe/Istanbul';
  }
}

// Aladhan calendar: ayın tüm günleri
export async function fetchMonthlyPrayerTimesByCoords(
  year: number,
  month1to12: number,
  latitude: number,
  longitude: number,
  methodId = 13,
  timeZone?: string,
  cacheLabel?: string,
): Promise<PrayerTimings[]> {
  let tz = timeZone;
  if (!tz) {
    try {
      tz = getTimeZoneByCoords(latitude, longitude);
    } catch {
      tz = getDeviceTimeZone();
    }
  }
  const key = `${year}-${String(month1to12).padStart(
    2,
    '0',
  )}@${latitude.toFixed(2)},${longitude.toFixed(2)}@${methodId}@${tz}`;
  const cached = monthCache.get(key);
  if (cached) return cached;
  try {
    const cachedRaw = await AsyncStorage.getItem(
      `${STORAGE_PREFIX}:${key}`,
    );
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as StoredMonthCache;
      if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
        if (cacheLabel && !parsed.cacheLabel) {
          const nextPayload: StoredMonthCache = {
            ...parsed,
            cacheLabel,
          };
          await AsyncStorage.setItem(
            `${STORAGE_PREFIX}:${key}`,
            JSON.stringify(nextPayload),
          );
        }
        monthCache.set(key, parsed.data);
        return parsed.data;
      }
    }
  } catch (err) {
    console.warn('[prayer-times] Month cache read failed', err);
  }

  // method=13 (Diyanet) aynı kalsın; ihtiyaç olursa ayarlanabilir.
  const tzParam = encodeURIComponent(tz ?? getDeviceTimeZone());
  const url = `https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=${methodId}&month=${month1to12}&year=${year}&timezonestring=${tzParam}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json?.code !== 200)
    throw new Error(json?.data || i18next.t('errors.prayerTimesFetchFailed'));

  // Günlük kayıtlardan sadece ihtiyacımız olan 6 vaktin HH:mm kısmını çek.
  const strip = (s: string) => {
    const m = String(s).match(/(\d{2}:\d{2})/);
    return m ? m[1] : s;
  };
  const data: PrayerTimings[] = json.data.map((d: any) => {
    const t = d.timings || {};
    return {
      Fajr: strip(t.Fajr),
      Sunrise: strip(t.Sunrise),
      Dhuhr: strip(t.Dhuhr),
      Asr: strip(t.Asr),
      Maghrib: strip(t.Maghrib),
      Isha: strip(t.Isha),
    };
  });
  monthCache.set(key, data);
  try {
    const payload: StoredMonthCache = {
      data,
      fetchedAt: new Date().toISOString(),
      cacheLabel,
    };
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}:${key}`,
      JSON.stringify(payload),
    );
  } catch (err) {
    console.warn('[prayer-times] Month cache write failed', err);
  }
  return data;
}
