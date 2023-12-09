import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';

import Backend from 'i18next-http-backend';
import {languageDetectorPlugin} from './libs/core/utils/i18next.languageDetector';
import translationEN from './libs/localization/en/translation.json';
import translationTR from './libs/localization/tr/translation.json';

export const resources = {
  en: {
    translation: translationEN,
  },
  tr: {
    translation: translationTR,
  },
};

const options = {
  compatibilityJSON: 'v3',
  fallbackLng: 'tr',
  debug: true,
  resources,
};

i18next
  .use(Backend)
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init(options);

export default i18next;
