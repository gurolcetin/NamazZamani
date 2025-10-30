// libs/redux/reducers/locationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SavedPlace = {
  id: string; // "nom:123" gibi
  label: string;
  latitude: number;
  longitude: number;
};

export type ActivePlace = { type: 'device' } | { id: string };

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
    // sabit konumu ekle/varsa güncelle
    upsertSavedPlace(state, action: PayloadAction<SavedPlace>) {
      const i = state.saved.findIndex(x => x.id === action.payload.id);
      if (i >= 0) state.saved[i] = action.payload;
      else state.saved.unshift(action.payload);
    },
    // kaydı sil; aktif o ise device’a dön
    removeSavedPlace(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.saved = state.saved.filter(x => x.id !== id);
      if ('id' in state.active && state.active.id === id) {
        state.active = { type: 'device' };
      }
    },
    setActiveDevice(state) {
      state.active = { type: 'device' };
    },
    setActiveById(state, action: PayloadAction<string>) {
      // id saved içinde yoksa yine de set edebiliriz (ör. yeni eklenecek)
      state.active = { id: action.payload };
    },
    // tamamen sıfırla (opsiyonel)
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
export const selectActiveResolved = (s: any) => {
  const active = selectActivePlace(s);
  const saved = selectSavedPlaces(s);
  if ('type' in active && active.type === 'device')
    return { type: 'device' as const };
  const found = saved.find(x => x.id === active.id);
  return found ? found : { type: 'device' as const };
};
