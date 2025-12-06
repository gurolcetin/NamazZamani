export type ApiLanguage = 'en' | 'tr';

const TOTAL_QURAN_AYAHS = 6236;
const CONTEXT_DEPENDENT_VERSES_URL =
  'https://gurolcetin.github.io/namaz-zamani-public-files/context_dependent_verses.json';

// Cache süresi (ms) – şu an 24 saat
const EXCLUDED_AYAHS_TTL = 1000 * 60 * 60 * 24;

// Bellek içi cache
let excludedAyahsCache: Set<number> | null = null;
let excludedAyahsFetchedAt = 0;

export const getApiLanguage = (language?: string | null): ApiLanguage => {
  if (language && language.toLowerCase().startsWith('tr')) {
    return 'tr';
  }
  return 'en';
};

const loadExcludedAyahs = async (): Promise<Set<number>> => {
  const now = Date.now();

  // Geçerli cache varsa ve TTL dolmamışsa onu kullan
  if (
    excludedAyahsCache &&
    now - excludedAyahsFetchedAt < EXCLUDED_AYAHS_TTL
  ) {
    return excludedAyahsCache;
  }

  const excludedAyahs = new Set<number>();

  if (typeof fetch === 'function') {
    try {
      const response = await fetch(CONTEXT_DEPENDENT_VERSES_URL /*, {
        // İstersen tarayıcı cache’ini de baypas edebilirsin:
        // cache: 'no-cache',
      }*/);
      if (!response.ok) {
        throw new Error('FAILED');
      }

      const json = await response.json();

      if (Array.isArray(json)) {
        json.forEach(item => {
          const ayahNumber = Number(item);
          if (
            Number.isInteger(ayahNumber) &&
            ayahNumber >= 1 &&
            ayahNumber <= TOTAL_QURAN_AYAHS
          ) {
            excludedAyahs.add(ayahNumber);
          }
        });
      }
    } catch {
      // Hata olursa eksik ayet listesini boş bırak
      // ve uygulama herhangi bir ayeti gösterebilsin
      return new Set<number>();
    }
  }

  excludedAyahsCache = excludedAyahs;
  excludedAyahsFetchedAt = now;
  return excludedAyahs;
};

export const getRandomAyahNumber = async (): Promise<number> => {
  const excludedAyahs = await loadExcludedAyahs();

  if (excludedAyahs.size >= TOTAL_QURAN_AYAHS) {
    return Math.floor(Math.random() * TOTAL_QURAN_AYAHS) + 1;
  }

  let ayahNumber = Math.floor(Math.random() * TOTAL_QURAN_AYAHS) + 1;
  while (excludedAyahs.has(ayahNumber)) {
    ayahNumber = Math.floor(Math.random() * TOTAL_QURAN_AYAHS) + 1;
  }
  return ayahNumber;
};

export const getQuranTranslationEdition = (language: ApiLanguage) =>
  language === 'tr' ? 'tr.diyanet' : 'en.pickthall';

// Boş dizi gelmeyeceğini varsayıyorsan bu hali yeterli:
export const pickRandomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

// Eğer istersen daha güvenli versiyon (boş olursa undefined döner):
// export const pickRandomItem = <T>(items: T[]): T | undefined =>
//   items.length === 0
//     ? undefined
//     : items[Math.floor(Math.random() * items.length)];
