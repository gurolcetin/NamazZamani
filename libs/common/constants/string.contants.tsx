export const MenuIconConstants = {
  PrayerTime: 'mosque',
  MissedTracking: 'calendar-check',
  Dhikr: 'ballot',
  Settings: 'gear',
};

export const AsyncStorageConstants = {
  LanguageKey: 'applicationLanguage',
  MissedPrayer: 'missedPrayer',
};

export const LanguagePrefix = {
  ENGLISH: 'en',
  TURKISH: 'tr',
};

export const LanguageLocaleKeys = {
  ENGLISH: 'en-US',
  TURKISH: 'tr-TR',
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

export class FastingConstants {
  public static readonly Fasting = 'Fasting';
}

export class HapticFeedbackMethods {
  public static readonly ImpactLight = 'impactLight';
  public static readonly ImpactMedium = 'impactMedium';
  public static readonly ImpactHeavy = 'impactHeavy';
  public static readonly Rigid = 'rigid';
  public static readonly Soft = 'soft';
  public static readonly NotificationSuccess = 'notificationSuccess';
  public static readonly NotificationWarning = 'notificationWarning';
  public static readonly NotificationError = 'notificationError';
  public static readonly Selection = 'selection';
  public static readonly ClockTick = 'clockTick';
  public static readonly ContextClick = 'contextClick';
  public static readonly KeyboardPress = 'keyboardPress';
  public static readonly KeyboardRelease = 'keyboardRelease';
  public static readonly KeyboardTap = 'keyboardTap';
  public static readonly LongPress = 'longPress';
  public static readonly TextHandleMove = 'textHandleMove';
  public static readonly VirtualKey = 'virtualKey';
  public static readonly VirtualKeyRelease = 'virtualKeyRelease';
  public static readonly EffectClick = 'effectClick';
  public static readonly EffectDoubleClick = 'effectDoubleClick';
  public static readonly EffectHeavyClick = 'effectHeavyClick';
  public static readonly EffectTick = 'effectTick';
}