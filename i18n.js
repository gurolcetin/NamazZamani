import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';

import Backend from 'i18next-http-backend';
import {
  languageDetectorPlugin,
  DEFAULT_LANGUAGE,
  GetDeviceLang,
} from './libs/core/utils/i18next.languageDetector';
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

const supportedLanguages = Object.keys(resources);
const deviceLanguage = GetDeviceLang();

const options = {
  compatibilityJSON: 'v3',
  fallbackLng: DEFAULT_LANGUAGE,
  debug: true,
  supportedLngs: supportedLanguages,
  lng:
    (deviceLanguage && supportedLanguages.includes(deviceLanguage)
      ? deviceLanguage
      : undefined) || DEFAULT_LANGUAGE,
  resources,
};

i18next
  .use(Backend)
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init(options);

export default i18next;
