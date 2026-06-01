export type PrayerTimeMethodOption = {
  id: number;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
};

export const PRAYER_TUNE_KEYS = [
  'imsak',
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'sunset',
  'isha',
  'midnight',
] as const;

export type PrayerTuneKey = (typeof PRAYER_TUNE_KEYS)[number];

export type PrayerTimeTuneSettings = Record<PrayerTuneKey, number>;

export const DEFAULT_PRAYER_TIME_TUNE: PrayerTimeTuneSettings = {
  imsak: 0,
  fajr: 0,
  sunrise: -7,
  dhuhr: 5,
  asr: 4,
  maghrib: 7,
  sunset: 0,
  isha: 0,
  midnight: 0,
};
