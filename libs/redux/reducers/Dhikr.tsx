import {createSlice} from '@reduxjs/toolkit';

const clearState = {
  dhikrs: [],
};
const initialState = {
  dhikrs: [
    {
      id: 1,
      name: 'AllDhikr',
      dhikrList: [],
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
          isCyclical: false,
        },
        {
          dhikrId: 2,
          name: 'Alhamdulillah',
          count: 0,
          maxCount: 33,
          isCyclical: false,
        },
        {
          dhikrId: 3,
          name: 'Allahuakbar',
          count: 0,
          maxCount: 33,
          isCyclical: false,
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
    isCyclical: false,
  },
  {
    dhikrId: 2,
    name: 'Alhamdulillah',
    count: 0,
    maxCount: 33,
    isCyclical: false,
  },
  {
    dhikrId: 3,
    name: 'Allahuakbar',
    count: 0,
    maxCount: 33,
    isCyclical: false,
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
      if (dhikr && (dhikr.count < dhikr.maxCount || dhikr.isCyclical)) {
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
    addDhikr: (state, action) => {
        const {id, name, maxCount} = action.payload;
        const index = state.dhikrs.findIndex((x: {id: number}) => x.id === id);
        const maxDhikrId = state.dhikrs[index].dhikrList.reduce((maxId, dhikr) => Math.max(maxId, dhikr.dhikrId), 0);
        state.dhikrs[index].dhikrList.push({
            dhikrId: maxDhikrId + 1,
            name: name,
            count: 0,
            maxCount: maxCount,
            isCyclical: true,
        });
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
  addDhikr,
} = Dhikr.actions;

export default Dhikr.reducer;
