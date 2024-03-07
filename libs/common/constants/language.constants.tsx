import {LanguageModel} from '../models';

export class SettingsConstants {
  static LanguageSettings: LanguageModel = {
    key: 'settings.LanguageSettings',
    defaultValue: 'Dil Ayarları',
  };
  static ThemeSettings: LanguageModel = {
    key: 'settings.ThemeSettings',
    defaultValue: 'Tema Ayarları',
  };
  static CalculateSettings: LanguageModel = {
    key: 'settings.CalculateSettings',
    defaultValue: 'Hesaplama Ayarları',
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
  static Dhikr: LanguageModel = {
    key: 'menu.Dhikr',
    defaultValue: 'Zikir',
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
  static BirthDateError: LanguageModel = {
    key: 'MissedTracking.BirthDateError',
    defaultValue: 'Doğum tarihi bugünün tarihinden büyük olamaz"',
  };
  static BirthDatePubertyError: LanguageModel = {
    key: 'MissedTracking.BirthDatePubertyError',
    defaultValue:
      'Doğum tarihi ve buluğ çağına giriş yaşının toplamları bugünün tarihinden büyük olamaz!',
  };
  static BirthDateControlError: LanguageModel = {
    key: 'MissedTracking.BirthDateControlError',
    defaultValue: 'Lütfen doğum tarihinizi kontrol ediniz.',
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
  static NumberofMissedPrayerBirthDatePubertyError: LanguageModel = {
    key: 'MissedPrayerForm.NumberofMissedPrayerBirthDatePubertyError',
    defaultValue: 'Doğum tarihi, kılınan namaz sayısı ve buluğ çağına giriş yaşının toplamları bugünün tarihinden büyük olamaz!',
  };
  static MissedPrayerNotCalculatedError: LanguageModel = {
    key: 'MissedPrayerForm.MissedPrayerNotCalculatedError',
    defaultValue: 'Kılınan namaz sayısı hesaplanamadı. Lütfen bilgilerinizi kontrol ediniz.',
  };
  static NoMissedPrayer: LanguageModel = {
    key: 'MissedPrayerForm.NoMissedPrayer',
    defaultValue: 'Tebrikler! Kılınmamış namazınız bulunmamaktadır.',
  };
}

export class FastingFormLanguageConstants {
  static FastsNotCalculatedError: LanguageModel = {
    key: 'FastingForm.FastsNotCalculatedError',
    defaultValue: 'Tutulan oruç sayısı hesaplanamadı. Lütfen bilgilerinizi kontrol ediniz.',
  };
  static NoOutstandingFasts: LanguageModel = {
    key: 'FastingForm.NoOutstandingFasts',
    defaultValue: 'Tebrikler! Tutulmamış orucunuz bulunmamaktadır.',
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

export class CalculateSettingsLanguageConstants {
  static NumberOfMenstrualDays: LanguageModel = {
    key: 'CalculateSettings.NumberOfMenstrualDays',
    defaultValue: 'Hayızlı Gün Sayısı',
  };
}

export class DhikrLanguageConstants {
  static Dhikr: LanguageModel = {
    key: 'Dhikr.Dhikr',
    defaultValue: 'Zikir',
  };
  static AllDhikr: LanguageModel = {
    key: 'Dhikr.AllDhikr',
    defaultValue: 'Zikirlerim',
  };
  static PrayerDhikr: LanguageModel = {
    key: 'Dhikr.PrayerDhikr',
    defaultValue: 'Namaz Zikirleri',
  };
}