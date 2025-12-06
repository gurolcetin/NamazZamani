import { getTimeZoneByCoords } from '../../../libs/core/helpers';
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

export async function fetchPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  baseDate: Date = new Date(), // cihazın o anki tarihi (veya geçilecek tarih)
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
  const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${latitude}&longitude=${longitude}&method=13&timezonestring=${encodeURIComponent(
    tzString,
  )}`;
  const makeNetworkError = (cause?: unknown) => {
    const err: any = new Error('PRAYER_TIMES_NETWORK_ERROR');
    err.prayerTimesCode = 'NETWORK_OR_DEVICE_DATE';
    err.cause = cause;
    return err;
  };
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    if (url.startsWith('https://')) {
      try {
        const insecureUrl = url.replace('https://', 'http://');
        console.warn(
          '[prayer-times] HTTPS fetch failed, retrying over HTTP fallback.',
          err,
        );
        res = await fetch(insecureUrl);
      } catch (err2) {
        console.warn('[prayer-times] HTTP fallback also failed.', err2);
        throw makeNetworkError(err2);
      }
    } else {
      throw makeNetworkError(err);
    }
  }
  const json = await res.json();
  if (json?.code !== 200) {
    throw new Error(json?.data || i18next.t('errors.prayerTimesFetchFailed'));
  }
  return json.data.timings as PrayerTimings;
}
