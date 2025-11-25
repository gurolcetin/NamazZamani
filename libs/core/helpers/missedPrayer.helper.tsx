import {
  CalculatedMissedPrayerLanguageConstants,
  PrayerTimeConstants,
  StringConstants,
} from '../../common/constants';
import {TFunction} from 'i18next';

export const GetPrayerNameByLanguage = (
  prayerName: string,
  t: TFunction,
) => {
  switch (prayerName) {
    case PrayerTimeConstants.SUNRISE:
      return t(CalculatedMissedPrayerLanguageConstants.Sunrise.key);
    case PrayerTimeConstants.DHUHR:
      return t(CalculatedMissedPrayerLanguageConstants.Dhuhr.key);
    case PrayerTimeConstants.ASR:
      return t(CalculatedMissedPrayerLanguageConstants.Asr.key);
    case PrayerTimeConstants.MAGHRIB:
      return t(CalculatedMissedPrayerLanguageConstants.Maghrib.key);
    case PrayerTimeConstants.ISHA:
      return t(CalculatedMissedPrayerLanguageConstants.Isha.key);
    case PrayerTimeConstants.WITR:
      return t(CalculatedMissedPrayerLanguageConstants.Witr.key);
    default:
      return StringConstants.EMPTY_STRING;
  }
};
