import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  dhikrs: [
    {
      id: 1,
      name: 'AllDhikr',
      dhikrList: [
        {
          dhikrId: 1,
          name: 'La İlahe İllallah',
          count: 0,
          maxCount: 100,
        },
      ],
    },
    {
      id: 2,
      name: 'PrayerDhikr',
      dhikrList: [
        {
          dhikrId: 1,
          name: 'Subhanallah',
          count: 0,
          maxCount: 33,
        },
        {
          dhikrId: 2,
          name: 'Alhamdulillah',
          count: 0,
          maxCount: 33,
        },
        {
          dhikrId: 3,
          name: 'Allahuakbar',
          count: 0,
          maxCount: 33,
        },
      ],
    },
  ],
};

const initialStatePrayerDhikr = [
  {
    dhikrId: 1,
    name: 'Subhanallah',
    count: 0,
    maxCount: 33,
  },
  {
    dhikrId: 2,
    name: 'Alhamdulillah',
    count: 0,
    maxCount: 33,
  },
  {
    dhikrId: 3,
    name: 'Allahuakbar',
    count: 0,
    maxCount: 33,
  },
];

const Dhikr = createSlice({
  name: 'dhikr',
  initialState: initialState,
  reducers: {
    resetDhikr: () => {
      return initialState;
    },
    resetPrayerDhikr: state => {
      state.dhikrs[1].dhikrList = initialStatePrayerDhikr;
    },
    resetDhikrByItem: (state, action) => {
      const {dhikrId} = action.payload;
      const index = state.dhikrs[0].dhikrList.findIndex((x: {dhikrId: number}) => x.dhikrId === dhikrId);
      state.dhikrs[0].dhikrList[index].count = 0;
    },
    updateDhikr: (state, action) => {
      const {id, dhikrId} = action.payload;
      const index = state.dhikrs.findIndex((x: {id: number}) => x.id === id);
      const dhikr = state.dhikrs[index].dhikrList.find(
        x => x.dhikrId === dhikrId,
      );
      if (dhikr && dhikr.count < dhikr.maxCount) {
        dhikr.count += 1;
      }
    },
  },
});

export const {resetDhikr, resetPrayerDhikr, resetDhikrByItem, updateDhikr} = Dhikr.actions;

export default Dhikr.reducer;
