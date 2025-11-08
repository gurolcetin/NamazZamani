// src/prayerApi.ts
import { getTimeZoneByCoords } from '../../../libs/core/helpers';

export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
};

export async function fetchPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  baseDate: Date = new Date(), // <-- eklendi
): Promise<PrayerTimings> {
  let tzString = 'Europe/Istanbul';
  try {
    tzString = getTimeZoneByCoords(latitude, longitude);
  } catch (err) {
    console.warn('Fallback to default timezone', err);
  }

  // Cihaz tarihine göre timestamp (saniye)
  const ts = Math.floor(baseDate.getTime() / 1000);

  // O güne ait vakitleri al
  const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${latitude}&longitude=${longitude}&method=13&timezonestring=${encodeURIComponent(
    tzString,
  )}`;

  const res = await fetch(url);
  const json = await res.json();
  if (json?.code !== 200) {
    throw new Error(json?.data || 'API hatası');
  }
  return json.data.timings as PrayerTimings;
}
