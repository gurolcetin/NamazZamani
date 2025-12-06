import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PrayerTimings } from '../../../src/screens/PrayerTime/api';

type CachedCoords = { lat: number; lon: number };

export type CachedPrayerSnapshot = {
  timings: PrayerTimings | null;
  locationLabel: string | null;
  utcLabel: string | null;
  coords: CachedCoords | null;
  sequenceBaseDate: string | null;
  lastUpdated: string | null;
};

export type CachedRamadanSnapshot = {
  iftarTarget: string | null;
  sahurTarget: string | null;
  maghribToday: string | null;
  fajrToday: string | null;
  calculatedAt: string | null;
};

export type CachedQuranAyah = {
  arabicText: string;
  translation: string;
  surahName?: string;
  surahNumber?: number;
  verseNumber?: number;
};

export type CachedHadith = {
  arabic: string;
  translation: string;
  bookName?: string;
  number?: string | number;
};

export type CachedAsma = {
  arabicName: string;
  transliteration?: string;
  meaning: string;
};

type InspirationCache<T> = {
  data: T | null;
  updatedAt: string | null;
};

type PrayerTimesCacheState = {
  prayer: CachedPrayerSnapshot;
  ramadan: CachedRamadanSnapshot;
  quranAyah: InspirationCache<CachedQuranAyah>;
  hadith: InspirationCache<CachedHadith>;
  asmaulHusna: InspirationCache<CachedAsma>;
  timeTable: {
    sections: CachedTimeTableSection[] | null;
    startDate: string | null;
    coords: CachedCoords | null;
    lastUpdated: string | null;
  };
};

const initialState: PrayerTimesCacheState = {
  prayer: {
    timings: null,
    locationLabel: null,
    utcLabel: null,
    coords: null,
    sequenceBaseDate: null,
    lastUpdated: null,
  },
  ramadan: {
    iftarTarget: null,
    sahurTarget: null,
    maghribToday: null,
    fajrToday: null,
    calculatedAt: null,
  },
  quranAyah: {
    data: null,
    updatedAt: null,
  },
  hadith: {
    data: null,
    updatedAt: null,
  },
  asmaulHusna: {
    data: null,
    updatedAt: null,
  },
  timeTable: {
    sections: null,
    startDate: null,
    coords: null,
    lastUpdated: null,
  },
};

type PrayerSnapshotPayload = {
  timings: PrayerTimings;
  locationLabel: string | null;
  utcLabel: string | null;
  coords: CachedCoords | null;
  sequenceBaseDate: string | null;
  calculatedAt?: string;
};

type RamadanSnapshotPayload = {
  iftarTarget: string;
  sahurTarget: string;
  maghribToday: string;
  fajrToday: string;
  calculatedAt?: string;
};

const timestampNow = () => new Date().toISOString();

const prayerTimesCacheSlice = createSlice({
  name: 'prayerTimesCache',
  initialState,
  reducers: {
    savePrayerSnapshot(state, action: PayloadAction<PrayerSnapshotPayload>) {
      state.prayer = {
        timings: action.payload.timings,
        locationLabel: action.payload.locationLabel,
        utcLabel: action.payload.utcLabel,
        coords: action.payload.coords,
        sequenceBaseDate: action.payload.sequenceBaseDate,
        lastUpdated: action.payload.calculatedAt ?? timestampNow(),
      };
    },
    saveRamadanSnapshot(
      state,
      action: PayloadAction<RamadanSnapshotPayload>,
    ) {
      state.ramadan = {
        iftarTarget: action.payload.iftarTarget,
        sahurTarget: action.payload.sahurTarget,
        maghribToday: action.payload.maghribToday,
        fajrToday: action.payload.fajrToday,
        calculatedAt: action.payload.calculatedAt ?? timestampNow(),
      };
    },
    saveQuranAyah(state, action: PayloadAction<CachedQuranAyah>) {
      state.quranAyah = {
        data: action.payload,
        updatedAt: timestampNow(),
      };
    },
    saveHadith(state, action: PayloadAction<CachedHadith>) {
      state.hadith = {
        data: action.payload,
        updatedAt: timestampNow(),
      };
    },
    saveAsmaulHusna(state, action: PayloadAction<CachedAsma>) {
      state.asmaulHusna = {
        data: action.payload,
        updatedAt: timestampNow(),
      };
    },
    saveTimeTableSnapshot(
      state,
      action: PayloadAction<{
        sections: CachedTimeTableSection[];
        startDate: string;
        coords: CachedCoords | null;
      }>,
    ) {
      state.timeTable = {
        sections: action.payload.sections,
        startDate: action.payload.startDate,
        coords: action.payload.coords,
        lastUpdated: timestampNow(),
      };
    },
  },
});

export const {
  savePrayerSnapshot,
  saveRamadanSnapshot,
  saveQuranAyah,
  saveHadith,
  saveAsmaulHusna,
  saveTimeTableSnapshot,
} = prayerTimesCacheSlice.actions;

export default prayerTimesCacheSlice.reducer;

export const selectPrayerSnapshot = (state: any): CachedPrayerSnapshot =>
  state?.prayerTimesCache?.prayer ?? initialState.prayer;

export const selectRamadanSnapshot = (state: any): CachedRamadanSnapshot =>
  state?.prayerTimesCache?.ramadan ?? initialState.ramadan;

export const selectCachedQuranAyah = (
  state: any,
): InspirationCache<CachedQuranAyah> =>
  state?.prayerTimesCache?.quranAyah ?? initialState.quranAyah;

export const selectCachedHadith = (state: any): InspirationCache<CachedHadith> =>
  state?.prayerTimesCache?.hadith ?? initialState.hadith;

export const selectCachedAsma = (state: any): InspirationCache<CachedAsma> =>
  state?.prayerTimesCache?.asmaulHusna ?? initialState.asmaulHusna;

export type CachedTimeTableRow = {
  dateISO: string;
  weekday: string;
  monthName: string;
  dayNum: string;
  times: PrayerTimings;
  isToday: boolean;
};

export type CachedTimeTableSection = {
  title: string;
  data: CachedTimeTableRow[];
};

export const selectCachedTimeTable = (state: any) =>
  state?.prayerTimesCache?.timeTable ?? initialState.timeTable;
