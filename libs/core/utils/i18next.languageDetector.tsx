import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageDetectorAsyncModule } from 'i18next';
import { NativeModules, Platform, I18nManager } from 'react-native';
import { AsyncStorageConstants } from '../../common/constants';

export const DEFAULT_LANGUAGE = 'tr';

const normalizeLocaleTag = (tag?: string | null) => {
  if (!tag) {
    return undefined;
  }
  const cleaned = tag
    .toString()
    .replace('_', '-')
    .split('-')[0]
    ?.trim()
    .toLowerCase();
  if (!cleaned) {
    return undefined;
  }
  return cleaned;
};

export const GetDeviceLang = () => {
  try {
    const resolveLocale = (
      source: string,
      candidates: Array<string | undefined>,
    ) => {
      const filtered = candidates.filter(Boolean);
      for (const candidate of filtered) {
        const normalized = normalizeLocaleTag(candidate);
        if (normalized) {
          return normalized;
        }
      }
      return undefined;
    };

    if (Platform.OS === 'ios') {
      const settings = NativeModules?.SettingsManager?.settings;
      const appleLocale = NativeModules.SettingsManager.getConstants().settings
        .AppleLocale as string | undefined;
      const appleLanguages = Array.isArray(settings?.AppleLanguages)
        ? (settings?.AppleLanguages[0] as string | undefined)
        : undefined;
      const rnLocale = (NativeModules as any)?.I18nManager?.localeIdentifier;
      const intlLocale =
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().locale
          : undefined;

      const normalized = resolveLocale('iOS', [
        appleLocale,
        appleLanguages,
        rnLocale,
        intlLocale,
      ]);

      return normalized;
    } else {
      // RN I18nManager veya NativeModules.I18nManager
      const androidLocale =
        (I18nManager as any)?.localeIdentifier ||
        NativeModules?.I18nManager?.localeIdentifier;
      const intlLocale =
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().locale
          : undefined;

      const normalized = resolveLocale('Android', [androidLocale, intlLocale]);

      return normalized;
    }
  } catch {
    return undefined;
  }
};

export const languageDetectorPlugin: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true, // callback yolunu kullanıyoruz
  init: () => {},
  detect: callback => {
    // >>> ÖNEMLİ: Burada ASLA async/await kullanmıyoruz, return type 'void' kalmalı
    const deviceLang = GetDeviceLang();

    AsyncStorage.getItem(AsyncStorageConstants.LanguageKey)
      .then(saved => {
        const savedLang = normalizeLocaleTag(saved);
        const lang = savedLang || deviceLang || DEFAULT_LANGUAGE;
        // callback opsiyonel tiplenmiş olabilir, guard ekleyelim
        if (callback) callback(lang);
      })
      .catch(() => {
        if (callback) callback(deviceLang || DEFAULT_LANGUAGE);
      });

    // Not: hiçbir şey return ETME (void olacak)
  },
  cacheUserLanguage: (language: string) => {
    // tip olarak void bekleniyor; async/await kullanmadan fire-and-forget
    const next = normalizeLocaleTag(language) || DEFAULT_LANGUAGE;
    AsyncStorage.setItem(AsyncStorageConstants.LanguageKey, next).catch(
      () => {},
    );
  },
};
