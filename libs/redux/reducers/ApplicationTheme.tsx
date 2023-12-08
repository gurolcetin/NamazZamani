import {createSlice} from '@reduxjs/toolkit';
import {Theme} from '../../common/enums';

const initialState = {
  theme: Theme.LIGHT,
};

const ApplicationTheme = createSlice({
  name: 'applicationtheme',
  initialState: initialState,
  reducers: {
    resetCategories: () => {
      return initialState;
    },
    updateApplicationTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const {resetCategories, updateApplicationTheme} =
  ApplicationTheme.actions;

export default ApplicationTheme.reducer;
