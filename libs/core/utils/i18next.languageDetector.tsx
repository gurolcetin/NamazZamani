import AsyncStorage from '@react-native-async-storage/async-storage';
import {LanguageDetectorAsyncModule} from 'i18next';
import {NativeModules, Platform} from 'react-native';
import {AsyncStorageConstants} from '../../common/constants';

export const GetDeviceLang = () => {
  const appLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0]
      : NativeModules.I18nManager.localeIdentifier;

  return appLanguage.search(/-|_/g) !== -1
    ? appLanguage.slice(0, 2)
    : appLanguage;
};

export const languageDetectorPlugin: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: (callback: (lang: string) => void) => {
    const deviceLang = GetDeviceLang();

    try {
      AsyncStorage.getItem(AsyncStorageConstants.LanguageKey)
        .then(language => {
          if (language) {
            return callback(language);
          } else {
            return callback(deviceLang);
          }
        })
        .catch(e => {
          return callback(deviceLang);
        });
    } catch (error) {
      return callback(deviceLang);
    }
  },
  cacheUserLanguage: (language: string) => {
    AsyncStorage.setItem(AsyncStorageConstants.LanguageKey, language).catch(
      e => {},
    );
  },
};
