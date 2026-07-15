import { getTimeZoneByCoords } from '../../../libs/core/helpers';
import {
  PrayerTimeMethodOption,
  PrayerTimeTuneSettings,
  DEFAULT_PRAYER_TIME_TUNE,
} from '../../../libs/common/types';
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
export const tuneSettingsToArray = (
  tune: PrayerTimeTuneSettings = DEFAULT_PRAYER_TIME_TUNE,
) => [
  tune.imsak,
  tune.fajr,
  tune.sunrise,
  tune.dhuhr,
  tune.asr,
  tune.maghrib,
  tune.sunset,
  tune.isha,
  tune.midnight,
];

export const DEFAULT_TUNE_OFFSETS = tuneSettingsToArray();

type FetchPrayerTimesOptions = {
  tune?: number[] | null;
  school?: 0 | 1;
  midnightMode?: 0 | 1;
  latitudeAdjustmentMethod?: 1 | 2 | 3;
  calendarMethod?: 'HJCoSA' | 'UAQ' | 'DIYANET' | 'MATHEMATICAL';
  shafaq?: 'general' | 'ahmer' | 'abyad';
  iso8601?: boolean;
};

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

/**
 * ISO 3166-1 alpha-2 ülke kodu → AlAdhan method ID eşleşmesi.
 * Bir ülke için resmi/yaygın bir hesaplama yöntemi varsa buraya eklenir.
 */
const COUNTRY_METHOD_MAP: Record<string, number> = {
  tr: 13, // Türkiye → Diyanet İşleri Başkanlığı
  eg: 5,  // Mısır → Egyptian General Authority of Survey
  sa: 4,  // Suudi Arabistan → Umm Al-Qura (Mekke)
  pk: 1,  // Pakistan → University of Islamic Sciences, Karachi
  ir: 7,  // İran → Institute of Geophysics, Tehran
  kw: 9,  // Kuveyt → Kuwait
  qa: 10, // Katar → Qatar
  sg: 11, // Singapur → MUIS Singapore
  fr: 12, // Fransa → UOIF France
  ru: 14, // Rusya → Spiritual Administration of Muslims of Russia
  ae: 16, // BAE → Dubai (experimental)
  my: 17, // Malezya → JAKIM
  tn: 18, // Tunus → Tunisia
  dz: 19, // Cezayir → Algeria
  id: 20, // Endonezya → KEMENAG
  ma: 21, // Fas → Morocco
  pt: 22, // Portekiz → Comunidade Islamica de Lisboa
  jo: 23, // Ürdün → Ministry of Awqaf, Jordan
  ps: 23, // Filistin → Jordan (yakın bölge)
  us: 2,  // ABD → ISNA
  ca: 2,  // Kanada → ISNA
  bh: 8,  // Bahreyn → Gulf Region
  om: 8,  // Umman → Gulf Region
  ye: 8,  // Yemen → Gulf Region
  iq: 3,  // Irak → Muslim World League
  sy: 3,  // Suriye → Muslim World League
  lb: 3,  // Lübnan → Muslim World League
  ly: 5,  // Libya → Egyptian (yakın bölge)
  sd: 5,  // Sudan → Egyptian (yakın bölge)
};

export const findClosestPrayerMethod = (
  methods: PrayerTimeMethodOption[],
  latitude: number,
  longitude: number,
  countryCode?: string | null,
): PrayerTimeMethodOption | null => {
  if (!methods?.length) {
    return null;
  }

  // 1) Ülke koduna göre doğrudan eşleşme dene
  if (countryCode) {
    const preferredId = COUNTRY_METHOD_MAP[countryCode.toLowerCase()];
    if (preferredId !== undefined) {
      const preferred = methods.find(m => m.id === preferredId);
      if (preferred) {
        return preferred;
      }
    }
  }

  // 2) Ülke eşleşmesi bulunamadıysa koordinat yakınlığına göre seç
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
  options: FetchPrayerTimesOptions = {},
): Promise<PrayerTimings> {
  let tzString = 'Europe/Istanbul';
  try {
    tzString = getTimeZoneByCoords(latitude, longitude); // örn: "Europe/Istanbul"
  } catch (err) {
    console.warn('Fallback to default timezone', err);
  }

  // Cihaz tarihine göre - saniye cinsinden timestamp
  const ts = Math.floor(baseDate.getTime() / 1000);

  const query: string[] = [
    `latitude=${encodeURIComponent(String(latitude))}`,
    `longitude=${encodeURIComponent(String(longitude))}`,
    `method=${encodeURIComponent(String(methodId))}`,
    `timezonestring=${encodeURIComponent(tzString)}`,
  ];

  if (typeof options.school === 'number') {
    query.push(`school=${encodeURIComponent(String(options.school))}`);
  }
  if (typeof options.midnightMode === 'number') {
    query.push(`midnightMode=${encodeURIComponent(String(options.midnightMode))}`);
  }
  if (typeof options.latitudeAdjustmentMethod === 'number') {
    query.push(
      `latitudeAdjustmentMethod=${encodeURIComponent(
        String(options.latitudeAdjustmentMethod),
      )}`,
    );
  }
  if (options.calendarMethod) {
    query.push(`calendarMethod=${encodeURIComponent(options.calendarMethod)}`);
  }
  if (options.shafaq) {
    query.push(`shafaq=${encodeURIComponent(options.shafaq)}`);
  }
  if (typeof options.iso8601 === 'boolean') {
    query.push(`iso8601=${encodeURIComponent(String(options.iso8601))}`);
  }

  if (Array.isArray(options.tune) && options.tune.length === 9) {
    query.push(`tune=${encodeURIComponent(options.tune.join(','))}`);
  }

  // O güne ait vakitler
  const url = `https://api.aladhan.com/v1/timings/${ts}?${query.join('&')}`;

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
