import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageDetectorAsyncModule } from 'i18next';
import { NativeModules, Platform, I18nManager } from 'react-native';
import { AsyncStorageConstants } from '../../common/constants';

export const GetDeviceLang = () => {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules?.SettingsManager?.settings;
      const appleLocale =
        settings?.AppleLocale ||
        (Array.isArray(settings?.AppleLanguages)
          ? settings.AppleLanguages[0]
          : undefined);

      const tag = appleLocale?.toString();
      if (!tag) return 'en';
      // "tr_TR" / "tr-TR" -> "tr"
      return tag.slice(0, 2);
    } else {
      // RN I18nManager veya NativeModules.I18nManager
      const androidLocale =
        (I18nManager as any)?.localeIdentifier ||
        NativeModules?.I18nManager?.localeIdentifier;

      const tag = androidLocale?.toString();
      if (!tag) return 'en';
      return tag.slice(0, 2);
    }
  } catch {
    return 'en';
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
        const lang = saved || deviceLang || 'en';
        // callback opsiyonel tiplenmiş olabilir, guard ekleyelim
        if (callback) callback(lang);
      })
      .catch(() => {
        if (callback) callback(deviceLang || 'en');
      });

    // Not: hiçbir şey return ETME (void olacak)
  },
  cacheUserLanguage: (language: string) => {
    // tip olarak void bekleniyor; async/await kullanmadan fire-and-forget
    AsyncStorage.setItem(AsyncStorageConstants.LanguageKey, language).catch(
      () => {},
    );
  },
};
