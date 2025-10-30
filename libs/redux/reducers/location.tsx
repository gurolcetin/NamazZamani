import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SavedPlace = {
  id: string; // "nom:123" gibi
  label: string;
  latitude: number;
  longitude: number;
};

export type ActivePlace = { type: 'device' } | { type: 'saved'; id: string };

// Discriminated union: cihaz mı sabit mi, net ayır
export type ActiveResolved =
  | { type: 'device' }
  | ({ type: 'saved' } & SavedPlace);

type LocationState = {
  saved: SavedPlace[];
  active: ActivePlace; // default: device
};

const initialState: LocationState = {
  saved: [],
  active: { type: 'device' },
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    upsertSavedPlace(state, action: PayloadAction<SavedPlace>) {
      const i = state.saved.findIndex(x => x.id === action.payload.id);
      if (i >= 0) state.saved[i] = action.payload;
      else state.saved.unshift(action.payload);
    },
    setActiveDevice(state) {
      state.active = { type: 'device' };
    },
    setActiveById(state, action: PayloadAction<string>) {
      state.active = { type: 'saved', id: action.payload };
    },
    removeSavedPlace(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.saved = state.saved.filter(x => x.id !== id);
      if (state.active.type === 'saved' && state.active.id === id) {
        state.active = { type: 'device' };
      }
    },
    resetLocationState: () => initialState,
  },
});

export const {
  upsertSavedPlace,
  removeSavedPlace,
  setActiveDevice,
  setActiveById,
  resetLocationState,
} = locationSlice.actions;

export default locationSlice.reducer;

/** ------- selectors ------- */
export const selectSavedPlaces = (s: any) =>
  (s?.location?.saved ?? []) as SavedPlace[];

export const selectActivePlace = (s: any) =>
  (s?.location?.active ?? { type: 'device' }) as ActivePlace;

/**
 * Her zaman discriminated union döndürür:
 *   { type: 'device' }  veya
 *   { type: 'saved', ...SavedPlace }
 */
export const selectActiveResolved = (s: any): ActiveResolved => {
  const active = selectActivePlace(s);
  const saved = selectSavedPlaces(s);

  if (active.type === 'device') {
    return { type: 'device' };
  }

  // active.type === 'saved'
  const found = saved.find(x => x.id === active.id);
  if (found) {
    const { id, label, latitude, longitude } = found;
    return { type: 'saved', id, label, latitude, longitude };
  }
  return { type: 'device' };
};
