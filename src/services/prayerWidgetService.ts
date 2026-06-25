import { NativeModules, Platform } from 'react-native';

import type { PrayerTimeKey } from '../../libs/common/types';
import type { PrayerTimings } from '../screens/PrayerTime/api';

type WidgetTheme = {
  primary: string;
  cardBackground: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
};

export type PrayerWidgetSnapshot = {
  timings: PrayerTimings;
  locationLabel: string | null;
  utcLabel: string | null;
  coords: { lat: number; lon: number } | null;
  sequenceBaseDate: string | null;
  labels: Record<PrayerTimeKey, string>;
  theme: WidgetTheme;
  savedAt: string;
};

type PrayerWidgetBridge = {
  updateSnapshot?: (payload: PrayerWidgetSnapshot) => Promise<boolean>;
};

const bridge = NativeModules.PrayerWidgetBridge as PrayerWidgetBridge | undefined;

export async function updatePrayerWidgetSnapshot(
  snapshot: Omit<PrayerWidgetSnapshot, 'savedAt'>,
) {
  if (Platform.OS !== 'ios' || typeof bridge?.updateSnapshot !== 'function') {
    return false;
  }

  try {
    return await bridge.updateSnapshot({
      ...snapshot,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[prayer-widget] Unable to update iOS widget snapshot', error);
    return false;
  }
}
