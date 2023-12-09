import AsyncStorage from '@react-native-async-storage/async-storage';
import {LanguageDetectorAsyncModule} from 'i18next';
import {NativeModules, Platform} from 'react-native';

const languageKey = 'applicationLanguage';

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
      AsyncStorage.getItem(languageKey)
        .then(language => {
          console.log('applicationLanguage', language);
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
    AsyncStorage.setItem(languageKey, language).catch(e => {
      console.log('[Cache user language error]', e);
    });
  },
};
