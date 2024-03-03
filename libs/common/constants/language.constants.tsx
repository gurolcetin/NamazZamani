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
  static LastUpdateDate: LanguageModel = {
    key: 'General.LastUpdateDate',
    defaultValue: 'Son Güncelleme Tarihi',
  };
  static BeginDate: LanguageModel = {
    key: 'General.BeginDate',
    defaultValue: 'Başlangıç Tarihi',
  };
  static Yes: LanguageModel = {
    key: 'General.Yes',
    defaultValue: 'Evet',
  };
  static No: LanguageModel = {
    key: 'General.No',
    defaultValue: 'Hayır',
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
  static EntryIntoPubertyAgeValidateMessage: LanguageModel = {
    key: 'MissedPrayerForm.EntryIntoPubertyAgeValidateMessage',
    defaultValue: 'Buluğ çağına giriş yaşı 8 ile 18 arasında olmalıdır',
  };
  static NumberofDaysofPrayer: LanguageModel = {
    key: 'MissedPrayerForm.NumberofDaysofPrayer',
    defaultValue: 'Namaz Kılınan Gün Sayısı',
  };
}

export class CalculatedMissedPrayerLanguageConstants {
  static Recalculate: LanguageModel = {
    key: 'CalculatedMissedPrayer.Recalculate',
    defaultValue: 'Yeniden Hesapla',
  };
  static RecalculateMessage: LanguageModel = {
    key: 'CalculatedMissedPrayer.RecalculateMessage',
    defaultValue: 'Yeniden hesaplamak istediğinize emin misiniz?',
  };
  static Sunrise: LanguageModel = {
    key: 'CalculatedMissedPrayer.Sunrise',
    defaultValue: 'Sabah',
  };
  static Dhuhr: LanguageModel = {
    key: 'CalculatedMissedPrayer.Dhuhr',
    defaultValue: 'Öğle',
  };
  static Asr: LanguageModel = {
    key: 'CalculatedMissedPrayer.Asr',
    defaultValue: 'İkindi',
  };
  static Maghrib: LanguageModel = {
    key: 'CalculatedMissedPrayer.Maghrib',
    defaultValue: 'Akşam',
  };
  static Isha: LanguageModel = {
    key: 'CalculatedMissedPrayer.Isha',
    defaultValue: 'Yatsı',
  };
  static Witr: LanguageModel = {
    key: 'CalculatedMissedPrayer.Witr',
    defaultValue: 'Vitir',
  };
}

export class CalculatedMissedFastingLanguageConstants {
  static Recalculate: LanguageModel = {
    key: 'CalculatedMissedPrayer.Recalculate',
    defaultValue: 'Yeniden Hesapla',
  };
  static RecalculateMessage: LanguageModel = {
    key: 'CalculatedMissedPrayer.RecalculateMessage',
    defaultValue: 'Yeniden hesaplamak istediğinize emin misiniz?',
  };
  static Fasting: LanguageModel = {
    key: 'CalculatedMissedFasting.Fasting',
    defaultValue: 'Oruç',
  };
  static NumberofFastsKept: LanguageModel = {
    key: 'CalculatedMissedFasting.NumberofFastsKept',
    defaultValue: 'Tutulan Oruç Sayısı',
  };
}