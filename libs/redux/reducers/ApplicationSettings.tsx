import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  PrayerTimeKey,
  PrayerTimeMethodOption,
} from '../../common/types';
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

type PrayerTimeMethodPreference = {
  methodId: number;
  manuallySet: boolean;
};

type PrayerTimeMethodPreferenceMap = Record<string, PrayerTimeMethodPreference>;

export const DEVICE_METHOD_KEY = 'device';

type ApplicationSettingsState = {
  showRamadanCountdownCard: boolean;
  showReligiousDaysSlider: boolean;
  showAsmaulHusnaCard: boolean;
  showHadithCard: boolean;
  showQuranAyahCard: boolean;
  prayerNotificationPreferences: PrayerNotificationPreferences;
  fontScale: FontScaleOption;
  isScrollReachToBottom: boolean;
  prayerTimeMethod: number;
  prayerTimeMethods: PrayerTimeMethodOption[];
  prayerTimeMethodsFetchedAt: string | null;
  prayerTimeMethodManuallySet: boolean;
  prayerTimeMethodPreferences: PrayerTimeMethodPreferenceMap;
};

const buildDefaultNotificationPreferences = (): PrayerNotificationPreferences =>
  PRAYER_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as PrayerNotificationPreferences);

const initialState: ApplicationSettingsState = {
  showRamadanCountdownCard: true,
  showReligiousDaysSlider: true,
  showAsmaulHusnaCard: true,
  showHadithCard: true,
  showQuranAyahCard: true,
  prayerNotificationPreferences: buildDefaultNotificationPreferences(),
  fontScale: FontScaleOption.MEDIUM,
  isScrollReachToBottom: false,
  prayerTimeMethod: 13,
  prayerTimeMethods: [],
  prayerTimeMethodsFetchedAt: null,
  prayerTimeMethodManuallySet: false,
  prayerTimeMethodPreferences: {
    [DEVICE_METHOD_KEY]: {
      methodId: 13,
      manuallySet: false,
    },
  },
};

const ensureNotificationPreferences = (
  state: ApplicationSettingsState,
): PrayerNotificationPreferences => {
  if (!state.prayerNotificationPreferences) {
    state.prayerNotificationPreferences = buildDefaultNotificationPreferences();
  }
  return state.prayerNotificationPreferences;
};

const ensureMethodPreferences = (
  state: ApplicationSettingsState,
): PrayerTimeMethodPreferenceMap => {
  if (!state.prayerTimeMethodPreferences) {
    state.prayerTimeMethodPreferences = {
      [DEVICE_METHOD_KEY]: {
        methodId: state.prayerTimeMethod ?? 13,
        manuallySet: state.prayerTimeMethodManuallySet ?? false,
      },
    };
  }
  return state.prayerTimeMethodPreferences;
};

const ApplicationSettings = createSlice({
  name: 'applicationSettings',
  initialState,
  reducers: {
    setShowRamadanCountdownCard: (state, action: PayloadAction<boolean>) => {
      state.showRamadanCountdownCard = action.payload;
    },
    setShowReligiousDaysSlider: (state, action: PayloadAction<boolean>) => {
      state.showReligiousDaysSlider = action.payload;
    },
    setShowAsmaulHusnaCard: (state, action: PayloadAction<boolean>) => {
      state.showAsmaulHusnaCard = action.payload;
    },
    setShowHadithCard: (state, action: PayloadAction<boolean>) => {
      state.showHadithCard = action.payload;
    },
    setShowQuranAyahCard: (state, action: PayloadAction<boolean>) => {
      state.showQuranAyahCard = action.payload;
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
    updatePrayerTimeMethod: (
      state,
      action: PayloadAction<{
        methodId: number;
        manuallySet?: boolean;
        locationKey?: string;
      }>,
    ) => {
      const key = action.payload.locationKey ?? DEVICE_METHOD_KEY;
      const prefs = ensureMethodPreferences(state);
      const current = prefs[key] ?? {
        methodId: state.prayerTimeMethod ?? 13,
        manuallySet: state.prayerTimeMethodManuallySet ?? false,
      };
      const manuallySet =
        typeof action.payload.manuallySet === 'boolean'
          ? action.payload.manuallySet
          : current.manuallySet;
      prefs[key] = {
        methodId: action.payload.methodId,
        manuallySet,
      };

      if (key === DEVICE_METHOD_KEY) {
        state.prayerTimeMethod = action.payload.methodId;
        if (typeof action.payload.manuallySet === 'boolean') {
          state.prayerTimeMethodManuallySet = action.payload.manuallySet;
        }
      }
    },
    setPrayerTimeMethodOptions: (
      state,
      action: PayloadAction<{
        methods: PrayerTimeMethodOption[];
        fetchedAt: string;
      }>,
    ) => {
      state.prayerTimeMethods = action.payload.methods;
      state.prayerTimeMethodsFetchedAt = action.payload.fetchedAt;
    },
  },
});

export const {
  setShowRamadanCountdownCard,
  setShowAsmaulHusnaCard,
  setShowHadithCard,
  setShowQuranAyahCard,
  setShowReligiousDaysSlider,
  setPrayerNotificationPreference,
  setFontScalePreference,
  updateAppConfig,
  updatePrayerTimeMethod,
  setPrayerTimeMethodOptions,
} = ApplicationSettings.actions;

export default ApplicationSettings.reducer;
