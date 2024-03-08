import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  numberOfMenstrualCycle: undefined,
};

const CalculateSettings = createSlice({
  name: 'calculateSettings',
  initialState: initialState,
  reducers: {
    resetCategories: () => {
      return initialState;
    },
    updateMenstrualCycle: (state, action) => {
      state.numberOfMenstrualCycle = action.payload.numberOfMenstrualCycle;
    },
  },
});

export const {resetCategories, updateMenstrualCycle} =
  CalculateSettings.actions;

export default CalculateSettings.reducer;
