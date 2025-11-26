export type ApiLanguage = 'en' | 'tr';

const TOTAL_QURAN_AYAHS = 6236;

export const getApiLanguage = (language?: string | null): ApiLanguage => {
  if (language && language.toLowerCase().startsWith('tr')) {
    return 'tr';
  }
  return 'en';
};

export const getRandomAyahNumber = () =>
  Math.floor(Math.random() * TOTAL_QURAN_AYAHS) + 1;

export const getQuranTranslationEdition = (language: ApiLanguage) =>
  language === 'tr' ? 'tr.diyanet' : 'en.pickthall';

export const pickRandomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];
