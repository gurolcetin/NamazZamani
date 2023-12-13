import {LanguageModel} from '../models';

export class SettingsConstants {
  static LanguageSettings: LanguageModel = {
    key: 'settings.LanguageSettings',
    defaultValue: 'Dil Seçenekleri',
  };
  static ThemeSettings: LanguageModel = {
    key: 'settings.ThemeSettings',
    defaultValue: 'Tema Seçenekleri',
  };
}

export class LanguageSettingsConstants {
  static Turkish: LanguageModel = {
    key: 'settings.Turkish',
    defaultValue: 'Türkçe',
  };
  static English: LanguageModel = {
    key: 'settings.English',
    defaultValue: 'İngilizce',
  };
}

export class ThemeSettingsConstants {
  static Dark: LanguageModel = {
    key: 'settings.Dark',
    defaultValue: 'Koyu',
  };
  static Light: LanguageModel = {
    key: 'settings.Light',
    defaultValue: 'Açık',
  };
  static SystemDefault: LanguageModel = {
    key: 'settings.SystemDefault',
    defaultValue: 'Sistem',
  };
}

export class MenuNameLanguageConstants {
  static PrayerTime: LanguageModel = {
    key: 'menu.PrayerTime',
    defaultValue: 'Namaz Vakitleri',
  };
  static MissedPrayer: LanguageModel = {
    key: 'menu.MissedPrayer',
    defaultValue: 'Kaza Takip',
  };
  static Settings: LanguageModel = {
    key: 'menu.Settings',
    defaultValue: 'Ayarlar',
  };
}
