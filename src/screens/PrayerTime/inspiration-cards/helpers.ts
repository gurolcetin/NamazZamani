export type ApiLanguage = 'en' | 'tr';

const TOTAL_QURAN_AYAHS = 6236;
const CONTEXT_DEPENDENT_VERSES_URL =
  'https://gurolcetin.github.io/namaz-zamani-public-files/context_dependent_verses.json';

export const getApiLanguage = (language?: string | null): ApiLanguage => {
  if (language && language.toLowerCase().startsWith('tr')) {
    return 'tr';
  }
  return 'en';
};

export const getRandomAyahNumber = async (): Promise<number> => {
  const excludedAyahs = new Set<number>();

  if (typeof fetch === 'function') {
    try {
      const response = await fetch(CONTEXT_DEPENDENT_VERSES_URL);
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
      // ignore errors and continue showing any ayah
    }
  }

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

export const pickRandomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];
