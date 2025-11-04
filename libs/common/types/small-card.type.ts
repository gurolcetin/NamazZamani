import { PrayerTimeKey } from './prayer-time-key';

export type SmallCard = {
  key: PrayerTimeKey;
  label: string;
  time: string;
  isCurrent?: boolean;
  miniLeft?: string;
  notif?: boolean;
};
