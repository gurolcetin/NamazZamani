import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';

// ─── Types ───────────────────────────────────────────────────────────────────

export type HijriCalendarMethod = 'HJCoSA' | 'UAQ' | 'DIYANET' | 'MATHEMATICAL';

export type HicriDate = {
  dayOfWeekText: string;
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  monthText: string;
  year: number;
  rawHijriDate: string;
  method: HijriCalendarMethod;
};

type AladhanBaseResponse<T> = {
  code: number;
  status: string;
  data: T;
};

type AladhanHijriDateResponse = {
  hijri: {
    date: string;
    format: string;
    day: string;
    weekday: {
      en: string;
      ar?: string;
    };
    month: {
      number: number;
      en: string;
      ar?: string;
      days?: number;
    };
    year: string;
    designation?: {
      abbreviated: string;
      expanded: string;
    };
    holidays?: string[];
    adjustedHolidays?: string[];
    method?: HijriCalendarMethod;
  };
  gregorian: {
    date: string;
    format: string;
    day: string;
    weekday: {
      en: string;
    };
    month: {
      number: number;
      en: string;
    };
    year: string;
    designation?: {
      abbreviated: string;
      expanded: string;
    };
    lunarSighting?: boolean;
  };
};

type CacheEntry<T> = {
  savedAt: number;
  data: T;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.aladhan.com/v1';
const DEFAULT_METHOD: HijriCalendarMethod = 'DIYANET';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a Date as DD-MM-YYYY for AlAdhan API.
 * Uses local date getters to avoid UTC timezone shift.
 *
 * Test cases:
 *   new Date(2026, 5, 21)  → '21-06-2026'
 *   new Date(2026, 0, 1)   → '01-01-2026'
 *   new Date(2026, 4, 26)  → '26-05-2026'
 */
function formatDateForAladhan(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = {savedAt: Date.now(), data};
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Cache write failure is non-fatal
  }
}

function mapResponseToHicriDate(
  item: AladhanHijriDateResponse,
  originalDate: Date,
  method: HijriCalendarMethod,
): HicriDate {
  const hijriMonthIndex = item.hijri.month.number - 1;
  const monthText = i18next.t(`hicri.months.${hijriMonthIndex}`);
  // Use local date weekday to match existing app index (0 = Sunday … 6 = Saturday)
  const weekdayIndex = originalDate.getDay();
  const dayOfWeekText = i18next.t(`hicri.weekdays.${weekdayIndex}`);

  return {
    dayOfWeekText,
    dayOfWeek: weekdayIndex + 1,
    dayOfMonth: Number(item.hijri.day),
    month: item.hijri.month.number,
    monthText,
    year: Number(item.hijri.year),
    rawHijriDate: item.hijri.date,
    method,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Converts a Gregorian date to Hijri using AlAdhan /gToH endpoint.
 * Default calendarMethod: DIYANET (Turkey/Diyanet compatibility).
 *
 * Manual test dates:
 *   GET https://api.aladhan.com/v1/gToH/21-06-2026?calendarMethod=DIYANET
 *   GET https://api.aladhan.com/v1/gToH/01-01-2026?calendarMethod=DIYANET
 *   GET https://api.aladhan.com/v1/gToH/26-05-2026?calendarMethod=DIYANET
 */
export async function convertMiladiDateToHicriDate(
  date: Date,
  options?: {
    calendarMethod?: HijriCalendarMethod;
    useCache?: boolean;
  },
): Promise<HicriDate> {
  const method = options?.calendarMethod ?? DEFAULT_METHOD;
  const useCache = options?.useCache !== false;
  const formatted = formatDateForAladhan(date);
  const cacheKey = `hijri:gToH:${method}:${formatted}`;

  if (useCache) {
    const cached = await getFromCache<HicriDate>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url = `${BASE_URL}/gToH/${formatted}?calendarMethod=${method}`;
  let response: Response;

  try {
    response = await fetch(url);
    console.log(`Hijri calendar API response for ${formatted}:`, response);
  } catch {
    const cached = await getFromCache<HicriDate>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error('Hijri calendar could not be fetched');
  }

  if (!response.ok) {
    const cached = await getFromCache<HicriDate>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error(`Hijri calendar API error: ${response.status}`);
  }

  const json: AladhanBaseResponse<AladhanHijriDateResponse> =
    await response.json();

  if (json.code !== 200) {
    const cached = await getFromCache<HicriDate>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error(
      `Hijri calendar API returned code ${json.code}: ${json.status}`,
    );
  }

  const result = mapResponseToHicriDate(json.data, date, method);

  if (useCache) {
    await saveToCache(cacheKey, result);
  }

  return result;
}

/**
 * Returns Hijri dates for every day in the given Gregorian month/year.
 * Uses AlAdhan /gToHCalendar endpoint.
 */
export async function getHijriCalendarForGregorianMonth(
  month: number,
  year: number,
  options?: {
    calendarMethod?: HijriCalendarMethod;
    useCache?: boolean;
  },
): Promise<HicriDate[]> {
  const method = options?.calendarMethod ?? DEFAULT_METHOD;
  const useCache = options?.useCache !== false;
  const cacheKey = `hijri:gToHCalendar:${method}:${month}:${year}`;

  if (useCache) {
    const cached = await getFromCache<HicriDate[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url = `${BASE_URL}/gToHCalendar/${month}/${year}?calendarMethod=${method}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    const cached = await getFromCache<HicriDate[]>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error('Hijri calendar could not be fetched');
  }

  if (!response.ok) {
    const cached = await getFromCache<HicriDate[]>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error(`Hijri calendar API error: ${response.status}`);
  }

  const json: AladhanBaseResponse<AladhanHijriDateResponse[]> =
    await response.json();

  if (json.code !== 200) {
    const cached = await getFromCache<HicriDate[]>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error(
      `Hijri calendar API returned code ${json.code}: ${json.status}`,
    );
  }

  const results: HicriDate[] = json.data.map(item => {
    // Parse gregorian date string (DD-MM-YYYY) using local constructor
    const parts = item.gregorian.date.split('-').map(Number);
    const gregorianDate = new Date(parts[2], parts[1] - 1, parts[0]);
    return mapResponseToHicriDate(item, gregorianDate, method);
  });

  if (useCache) {
    await saveToCache(cacheKey, results);
  }

  return results;
}

/**
 * Returns Gregorian dates for every day in the given Hijri month/year.
 * Uses AlAdhan /hToGCalendar endpoint.
 *
 * @param hijriMonth  1 = Muharrem … 12 = Zilhicce
 * @param hijriYear   Hijri year (e.g. 1448)
 */
export async function getGregorianCalendarForHijriMonth(
  hijriMonth: number,
  hijriYear: number,
  options?: {
    calendarMethod?: HijriCalendarMethod;
    useCache?: boolean;
  },
): Promise<any[]> {
  const method = options?.calendarMethod ?? DEFAULT_METHOD;
  const useCache = options?.useCache !== false;
  const cacheKey = `hijri:hToGCalendar:${method}:${hijriMonth}:${hijriYear}`;

  if (useCache) {
    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url = `${BASE_URL}/hToGCalendar/${hijriMonth}/${hijriYear}?calendarMethod=${method}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error('Hijri calendar could not be fetched');
  }

  if (!response.ok) {
    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error(`Hijri calendar API error: ${response.status}`);
  }

  const json: AladhanBaseResponse<any[]> = await response.json();

  if (json.code !== 200) {
    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new Error(
      `Hijri calendar API returned code ${json.code}: ${json.status}`,
    );
  }

  if (useCache) {
    await saveToCache(cacheKey, json.data);
  }

  return json.data;
}
