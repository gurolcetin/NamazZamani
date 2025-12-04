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

type PrayerNotificationPreferences = Record<PrayerTimeKey, boolean>;

type ApplicationSettingsState = {
  showRamadanCountdownCard: boolean;
  prayerNotificationPreferences: PrayerNotificationPreferences;
};

const buildDefaultNotificationPreferences = (): PrayerNotificationPreferences =>
  PRAYER_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as PrayerNotificationPreferences);

const initialState: ApplicationSettingsState = {
  showRamadanCountdownCard: true,
  prayerNotificationPreferences: buildDefaultNotificationPreferences(),
};

const ensureNotificationPreferences = (
  state: ApplicationSettingsState,
): PrayerNotificationPreferences => {
  if (!state.prayerNotificationPreferences) {
    state.prayerNotificationPreferences = buildDefaultNotificationPreferences();
  }
  return state.prayerNotificationPreferences;
};

const ApplicationSettings = createSlice({
  name: 'applicationSettings',
  initialState,
  reducers: {
    setShowRamadanCountdownCard: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showRamadanCountdownCard = action.payload;
    },
    setPrayerNotificationPreference: (
      state,
      action: PayloadAction<{ key: PrayerTimeKey; enabled: boolean }>,
    ) => {
      const { key, enabled } = action.payload;
      const prefs = ensureNotificationPreferences(state);
      prefs[key] = enabled;
    },
  },
});

export const {
  setShowRamadanCountdownCard,
  setPrayerNotificationPreference,
} = ApplicationSettings.actions;

export default ApplicationSettings.reducer;
