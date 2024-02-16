import {
  CalculatedMissedPrayerLanguageConstants,
  PrayerTimeConstants,
  StringConstants,
} from '../../common/constants';
import {Translate} from './language.helper';

export const GetPrayerNameByLanguage = (prayerName: string) => {
  switch (prayerName) {
    case PrayerTimeConstants.SUNRISE:
      return Translate(CalculatedMissedPrayerLanguageConstants.Sunrise);
    case PrayerTimeConstants.DHUHR:
      return Translate(CalculatedMissedPrayerLanguageConstants.Dhuhr);
    case PrayerTimeConstants.ASR:
      return Translate(CalculatedMissedPrayerLanguageConstants.Asr);
    case PrayerTimeConstants.MAGHRIB:
      return Translate(CalculatedMissedPrayerLanguageConstants.Maghrib);
    case PrayerTimeConstants.ISHA:
      return Translate(CalculatedMissedPrayerLanguageConstants.Isha);
    case PrayerTimeConstants.WITR:
      return Translate(CalculatedMissedPrayerLanguageConstants.Witr);
    default:
      return StringConstants.EMPTY_STRING;
  }
};
