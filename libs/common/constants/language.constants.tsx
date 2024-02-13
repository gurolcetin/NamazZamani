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
  static MissedTracking: LanguageModel = {
    key: 'menu.MissedTracking',
    defaultValue: 'Kaza Takip',
  };
  static Settings: LanguageModel = {
    key: 'menu.Settings',
    defaultValue: 'Ayarlar',
  };
}

export class MissedTrackingLanguageConstants {
  static MissedPrayer: LanguageModel = {
    key: 'MissedTracking.PrayerTracking',
    defaultValue: 'Kaza Takibi',
  };
  static MissedFasting: LanguageModel = {
    key: 'MissedTracking.FastingTracking',
    defaultValue: 'Oruç Takibi',
  };
}

export class GeneralLanguageConstants {
  static Male: LanguageModel = {
    key: 'General.Male',
    defaultValue: 'Erkek',
  };
  static Female: LanguageModel = {
    key: 'General.Female',
    defaultValue: 'Kadın',
  };
  static RequiredMessage: LanguageModel = {
    key: 'General.RequiredMessage',
    defaultValue: 'Bu alan zorunludur',
  };
  static Calculate: LanguageModel = {
    key: 'General.Calculate',
    defaultValue: 'Hesapla',
  };
}

export class MissedPrayerFormLanguageConstants {
  static Gender: LanguageModel = {
    key: 'MissedPrayerForm.Gender',
    defaultValue: 'Cinsiyet',
  };
  static BirthDate: LanguageModel = {
    key: 'MissedPrayerForm.BirthDate',
    defaultValue: 'Doğum Tarihi',
  };
  static EntryIntoPubertyAge: LanguageModel = {
    key: 'MissedPrayerForm.EntryIntoPubertyAge',
    defaultValue: 'Buluğ Çağına Giriş Yaşı',
  };
  static NumberofDaysofPrayer: LanguageModel = {
    key: 'MissedPrayerForm.NumberofDaysofPrayer',
    defaultValue: 'Namaz Kılınan Gün Sayısı',
  };
}
