import {createSlice} from '@reduxjs/toolkit';
import {Theme} from '../../common/enums';

const initialState = {
  theme: Theme.LIGHT, // resolved runtime theme (light/dark)
  preference: Theme.LIGHT, // user selection (light/dark/system)
};

const ApplicationTheme = createSlice({
  name: 'applicationtheme',
  initialState: initialState,
  reducers: {
    resetCategories: () => {
      return initialState;
    },
    updateApplicationTheme: (state, action) => {
      state.theme = action.payload?.theme ?? state.theme;
      state.preference = action.payload?.preference ?? state.preference;
    },
  },
});

export const {resetCategories, updateApplicationTheme} =
  ApplicationTheme.actions;

export default ApplicationTheme.reducer;
