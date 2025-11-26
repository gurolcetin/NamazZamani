import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ApplicationSettingsState = {
  showRamadanCountdownCard: boolean;
};

const initialState: ApplicationSettingsState = {
  showRamadanCountdownCard: true,
};

const ApplicationSettings = createSlice({
  name: 'applicationSettings',
  initialState,
  reducers: {
    setShowRamadanCountdownCard: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showRamadanCountdownCard = action.payload;
    },
  },
});

export const { setShowRamadanCountdownCard } = ApplicationSettings.actions;

export default ApplicationSettings.reducer;
