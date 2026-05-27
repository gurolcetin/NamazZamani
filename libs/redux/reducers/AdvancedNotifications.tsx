import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PrayerTimeKey } from '../../common/types';

const PRAYER_KEYS: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

export type NotificationSound =
  | 'default'
  | 'big_bell'
  | 'zil_sesi_1'
  | 'zil_sesi_2'
  | 'zil_sesi_3';

export type SilentModeDuration =
  | 'off'
  | '1h'
  | '2h'
  | '5h'
  | '12h'
  | '1d'
  | '7d';

// days[0]=Mon, days[1]=Tue, ..., days[6]=Sun
export type NotificationDays = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

export type NotificationItem = {
  id: string;
  offsetMinutes: number; // 0 = at prayer time, negative = before, positive = after
  enabled: boolean;
  sound: NotificationSound;
  snoozeMinutes: number; // 0 = off
  days: NotificationDays;
};

export type AdvancedNotificationState = {
  silentModeDuration: SilentModeDuration;
  silentModeStartedAt: string | null;
  perPrayer: Record<PrayerTimeKey, NotificationItem[]>;
};

const ALL_DAYS: NotificationDays = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
];

export const buildDefaultNotificationItem = (): NotificationItem => ({
  id: 'item_0',
  offsetMinutes: 0,
  enabled: true,
  sound: 'default',
  snoozeMinutes: 0,
  days: [...ALL_DAYS] as NotificationDays,
});

const buildDefaultPerPrayer = (): Record<PrayerTimeKey, NotificationItem[]> =>
  PRAYER_KEYS.reduce((acc, key) => {
    acc[key] = [buildDefaultNotificationItem()];
    return acc;
  }, {} as Record<PrayerTimeKey, NotificationItem[]>);

const initialState: AdvancedNotificationState = {
  silentModeDuration: 'off',
  silentModeStartedAt: null,
  perPrayer: buildDefaultPerPrayer(),
};

const ensurePerPrayer = (
  state: AdvancedNotificationState,
): Record<PrayerTimeKey, NotificationItem[]> => {
  if (!state.perPrayer) {
    state.perPrayer = buildDefaultPerPrayer();
  }
  PRAYER_KEYS.forEach(key => {
    if (!state.perPrayer[key] || state.perPrayer[key].length === 0) {
      state.perPrayer[key] = [buildDefaultNotificationItem()];
    }
  });
  return state.perPrayer;
};

const AdvancedNotifications = createSlice({
  name: 'advancedNotifications',
  initialState,
  reducers: {
    setSilentMode: (
      state,
      action: PayloadAction<{
        duration: SilentModeDuration;
        startedAt: string | null;
      }>,
    ) => {
      state.silentModeDuration = action.payload.duration;
      state.silentModeStartedAt = action.payload.startedAt;
    },
    addNotificationItem: (
      state,
      action: PayloadAction<{
        prayerKey: PrayerTimeKey;
        item: NotificationItem;
      }>,
    ) => {
      const { prayerKey, item } = action.payload;
      const perPrayer = ensurePerPrayer(state);
      perPrayer[prayerKey].push(item);
    },
    updateNotificationItem: (
      state,
      action: PayloadAction<{
        prayerKey: PrayerTimeKey;
        item: NotificationItem;
      }>,
    ) => {
      const { prayerKey, item } = action.payload;
      const perPrayer = ensurePerPrayer(state);
      const arr = perPrayer[prayerKey];
      const idx = arr.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        arr[idx] = item;
      }
    },
    removeNotificationItem: (
      state,
      action: PayloadAction<{ prayerKey: PrayerTimeKey; itemId: string }>,
    ) => {
      const { prayerKey, itemId } = action.payload;
      const perPrayer = ensurePerPrayer(state);
      const arr = perPrayer[prayerKey];
      // Keep at least one item (the at-time one)
      if (arr.length <= 1) return;
      perPrayer[prayerKey] = arr.filter(i => i.id !== itemId);
    },
    toggleNotificationItem: (
      state,
      action: PayloadAction<{
        prayerKey: PrayerTimeKey;
        itemId: string;
        enabled: boolean;
      }>,
    ) => {
      const { prayerKey, itemId, enabled } = action.payload;
      const perPrayer = ensurePerPrayer(state);
      const arr = perPrayer[prayerKey];
      const item = arr.find(i => i.id === itemId);
      if (item) {
        item.enabled = enabled;
      }
    },
    toggleAllPrayerNotifications: (
      state,
      action: PayloadAction<{ enabled: boolean }>,
    ) => {
      const { enabled } = action.payload;
      const perPrayer = ensurePerPrayer(state);
      PRAYER_KEYS.forEach(key => {
        perPrayer[key].forEach(item => {
          item.enabled = enabled;
        });
      });
    },
    ensureDefaultItems: state => {
      ensurePerPrayer(state);
    },
  },
});

export const {
  setSilentMode,
  addNotificationItem,
  updateNotificationItem,
  removeNotificationItem,
  toggleNotificationItem,
  toggleAllPrayerNotifications,
  ensureDefaultItems,
} = AdvancedNotifications.actions;

export default AdvancedNotifications.reducer;
