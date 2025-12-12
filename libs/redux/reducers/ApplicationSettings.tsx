import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PrayerTimeKey } from '../../common/types';
import { FontScaleOption } from '../../common/enums';

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
  fontScale: FontScaleOption;
  isScrollReachToBottom: boolean;
};

const buildDefaultNotificationPreferences = (): PrayerNotificationPreferences =>
  PRAYER_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as PrayerNotificationPreferences);

const initialState: ApplicationSettingsState = {
  showRamadanCountdownCard: true,
  prayerNotificationPreferences: buildDefaultNotificationPreferences(),
  fontScale: FontScaleOption.MEDIUM,
  isScrollReachToBottom: false,
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
    setShowRamadanCountdownCard: (state, action: PayloadAction<boolean>) => {
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
    setFontScalePreference: (state, action: PayloadAction<FontScaleOption>) => {
      state.fontScale = action.payload;
    },
    updateAppConfig: (state, action) => {
      state.isScrollReachToBottom = action.payload.isScrollReachToBottom;
    },
  },
});

export const {
  setShowRamadanCountdownCard,
  setPrayerNotificationPreference,
  setFontScalePreference,
  updateAppConfig,
} = ApplicationSettings.actions;

export default ApplicationSettings.reducer;
