export type { HicriDate, HijriCalendarMethod } from '../../../src/services/hijriCalendarService';
export { convertMiladiDateToHicriDate } from '../../../src/services/hijriCalendarService';

import { convertMiladiDateToHicriDate } from '../../../src/services/hijriCalendarService';

export const calculateRamadanCountBetweenDates = async (
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  const [startHicriDate, endHicriDate] = await Promise.all([
    convertMiladiDateToHicriDate(startDate),
    convertMiladiDateToHicriDate(endDate),
  ]);
  const startHicriYear = startHicriDate.year;
  const endHicriYear = endHicriDate.year;
  const startHicriMonth = startHicriDate.month;
  const endHicriMonth = endHicriDate.month;
  let ramadanCount = endHicriYear - startHicriYear - 1;
  if (endHicriMonth > 9) {
    ramadanCount += 1;
  }
  if (startHicriMonth < 9) {
    ramadanCount += 1;
  }
  return ramadanCount;
};
