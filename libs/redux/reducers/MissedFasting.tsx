import {createSlice} from '@reduxjs/toolkit';
import {FastingConstants} from '../../common/constants';

const initialState = {
  isMissedFastingCalculated: false,
  lastUpdateDate: new Date(),
  beginDate: new Date(),
  missedFasting: {
    date: new Date(),
    name: FastingConstants.Fasting,
    missedFastingCount: 0,
    performedFastingCount: 0,
  },
};

const MissedFasting = createSlice({
  name: 'missedFasting',
  initialState: initialState,
  reducers: {
    resetMissedFasting: () => {
      return initialState;
    },
    createMissedFasting: (state, action) => {
      state.isMissedFastingCalculated = true;
      state.beginDate = new Date();
      state.lastUpdateDate = new Date();
      state.missedFasting.missedFastingCount = action.payload; // hesaplanan kaza orucu sayısını güncelle
      state.missedFasting.date = new Date(); // kaza orucu eklendiği tarihi güncelle
      state.missedFasting.performedFastingCount = 0; // tutulan oruç sayısını sıfırla
    },
    increasePerformedFasting: (state, action) => {
      if (state.missedFasting.performedFastingCount > 0) {
        state.missedFasting.performedFastingCount -= 1;
        state.missedFasting.date = new Date();
        state.lastUpdateDate = new Date();
      }
    },
    decreasePerformedFasting: (state, action) => {
      if (
        state.missedFasting.performedFastingCount <
        state.missedFasting.missedFastingCount
      ) {
        state.missedFasting.performedFastingCount += 1;
        state.missedFasting.date = new Date();
        state.lastUpdateDate = new Date();
      }
    },
  },
});

export const {
  resetMissedFasting,
  createMissedFasting,
  increasePerformedFasting,
  decreasePerformedFasting,
} = MissedFasting.actions;

export default MissedFasting.reducer;
