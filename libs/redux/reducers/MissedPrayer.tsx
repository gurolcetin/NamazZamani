import {createSlice} from '@reduxjs/toolkit';
import {PrayerTimeConstants} from '../../common/constants';

const initialState = {
  isMissedPrayerCalculated: false,
  lastUpdateDate: new Date(),
  beginDate: new Date(),
  missedPrayers: [
    {
      id: 1,
      date: new Date(),
      name: PrayerTimeConstants.SUNRISE,
      missedPrayerCount: 0,
      performedPrayerCount: 0,
    },
    {
      id: 2,
      date: new Date(),
      name: PrayerTimeConstants.DHUHR,
      missedPrayerCount: 0,
      performedPrayerCount: 0,
    },
    {
      id: 3,
      date: new Date(),
      name: PrayerTimeConstants.ASR,
      missedPrayerCount: 0,
      performedPrayerCount: 0,
    },
    {
      id: 4,
      date: new Date(),
      name: PrayerTimeConstants.MAGHRIB,
      missedPrayerCount: 0,
      performedPrayerCount: 0,
    },
    {
      id: 5,
      date: new Date(),
      name: PrayerTimeConstants.ISHA,
      missedPrayerCount: 0,
      performedPrayerCount: 0,
    },
    {
      id: 6,
      date: new Date(),
      name: PrayerTimeConstants.WITR,
      missedPrayerCount: 0,
      performedPrayerCount: 0,
    },
  ],
};

const MissedPrayer = createSlice({
  name: 'missedPrayer',
  initialState: initialState,
  reducers: {
    resetMissedPrayer: () => {
      return initialState;
    },
    createMissedPrayer: (state, action) => {
      state.isMissedPrayerCalculated = true;
      state.beginDate = new Date();
      state.lastUpdateDate = new Date();
      state.missedPrayers.map((item, index) => {
        item.missedPrayerCount = action.payload; // hesaplanan kaza namazı sayısını her vakit için güncelle
        item.date = new Date(); // kaza namazı eklendiği tarihi güncelle
        item.performedPrayerCount = 0; // kılınan namaz sayısını sıfırla
        return item;
      });
    },
    increasePerformedPrayer: (state, action) => {
      state.missedPrayers.map((item, index) => {
        if (item.id === action.payload.id && item.performedPrayerCount > 0) {
          item.performedPrayerCount -= 1;
          item.date = new Date();
          state.lastUpdateDate = new Date();
        }
        return item;
      });
    },
    decreasePerformedPrayer: (state, action) => {
      state.missedPrayers.map((item, index) => {
        if (
          item.id === action.payload.id &&
          item.performedPrayerCount < item.missedPrayerCount
        ) {
          item.performedPrayerCount += 1;
          item.date = new Date();
          state.lastUpdateDate = new Date();
        }
        return item;
      });
    },
  },
});

export const {
  resetMissedPrayer,
  createMissedPrayer,
  increasePerformedPrayer,
  decreasePerformedPrayer,
} = MissedPrayer.actions;

export default MissedPrayer.reducer;
