export const MenuIconConstants = {
  PrayerTime: 'mosque',
  MissedTracking: 'calendar-check',
  Settings: 'gear',
};

export const AsyncStorageConstants = {
  LanguageKey: 'applicationLanguage',
  MissedPrayer: 'missedPrayer',
};

export const LanguagePrefix = {
  en: 'en',
  tr: 'tr',
};

export enum Gender {
  Male = 'M',
  Female = 'F',
}

export class StringConstants {
  public static readonly EMPTY_STRING = '';
  public static readonly SPACE = ' ';
  public static readonly COMMA = ',';
  public static readonly DOT = '.';
  public static readonly COLON = ':';
  public static readonly SLASH = '/';
  public static readonly DASH = '-';
  public static readonly UNDERSCORE = '_';
  public static readonly QUESTION_MARK = '?';
  public static readonly EQUALS = '=';
  public static readonly AMPERSAND = '&';
  public static readonly AT = '@';
  public static readonly HASH = '#';
  public static readonly PERCENT = '%';
  public static readonly CARET = '^';
}

export class PrayerTimeConstants {
  public static readonly SUNRISE = 'SUNRISE'; // sabah
  public static readonly DHUHR = 'Dhuhr'; // öğle
  public static readonly ASR = 'Asr'; // ikindi
  public static readonly MAGHRIB = 'Maghrib'; // akşam
  public static readonly ISHA = 'Isha'; // yatsı
  public static readonly WITR = 'Witr'; // vitir
}
