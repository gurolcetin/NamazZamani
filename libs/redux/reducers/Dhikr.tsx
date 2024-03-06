import {createSlice} from '@reduxjs/toolkit';

const clearState = {
  dhikrs: [],
};
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
        {
          dhikrId: 2,
          name: 'Allah',
          count: 0,
          maxCount: 10,
        },
        {
          dhikrId: 3,
          name: 'Rahman',
          count: 0,
          maxCount: 20,
        },
        {
          dhikrId: 4,
          name: 'Rahim',
          count: 0,
          maxCount: 20,
        },
        {
          dhikrId: 5,
          name: 'Kahhar',
          count: 0,
          maxCount: 20,
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
    clearAllDhikr: () => {
      return clearState;
    },
    resetDhikr: () => {
      return initialState;
    },
    resetPrayerDhikr: state => {
      state.dhikrs[1].dhikrList = initialStatePrayerDhikr;
    },
    resetDhikrByItem: (state, action) => {
      const {dhikrId} = action.payload;
      const index = state.dhikrs[0].dhikrList.findIndex(
        (x: {dhikrId: number}) => x.dhikrId === dhikrId,
      );
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
    deleteDhikrByDhikrId: (state, action) => {
      const {id, dhikrId} = action.payload;
      const index = state.dhikrs.findIndex((x: {id: number}) => x.id === id);
      const dhikrIndex = state.dhikrs[index].dhikrList.findIndex(
        (x: {dhikrId: number}) => x.dhikrId === dhikrId,
      );
      state.dhikrs[index].dhikrList.splice(dhikrIndex, 1);
    },
  },
});

export const {
  clearAllDhikr,
  resetDhikr,
  resetPrayerDhikr,
  resetDhikrByItem,
  updateDhikr,
  deleteDhikrByDhikrId,
} = Dhikr.actions;

export default Dhikr.reducer;
