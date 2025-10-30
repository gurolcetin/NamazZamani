import { getTimeZoneByCoords } from '../../../libs/core/helpers';

// src/prayerApi.ts
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
): Promise<PrayerTimings> {
  let tzString = 'Europe/Istanbul';
  try {
    tzString = getTimeZoneByCoords(latitude, longitude); // "America/New_York"
  } catch (err) {
    console.warn('Fallback to default timezone', err);
  }

  const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=13&timezonestring=${encodeURIComponent(
    tzString,
  )}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json?.code !== 200) {
    throw new Error(json?.data || 'API hatası');
  }
  return json.data.timings as PrayerTimings;
}
