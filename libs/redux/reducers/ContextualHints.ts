import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

type HintEntry = {
  dismissedForever: boolean;
  shownCount: number;
  lastShownAt: number | null;
};

type ContextualHintsState = {
  entries: Record<string, HintEntry>;
  activeHintId: string | null;
  queue: string[];
};

type RequestHintPayload = {
  hintId: string;
  frequencyMs: number;
  now: number;
};

type HintActionPayload = {
  hintId: string;
};

type CompleteHintPayload = {
  hintId: string;
  now: number;
};

const initialState: ContextualHintsState = {
  entries: {},
  activeHintId: null,
  queue: [],
};

const createDefaultEntry = (): HintEntry => ({
  dismissedForever: false,
  shownCount: 0,
  lastShownAt: null,
});

const ensureEntry = (state: ContextualHintsState, hintId: string): HintEntry => {
  if (!state.entries[hintId]) {
    state.entries[hintId] = createDefaultEntry();
  }
  return state.entries[hintId];
};

const removeFromQueue = (queue: string[], hintId: string) =>
  queue.filter(item => item !== hintId);

const activateNextInQueue = (state: ContextualHintsState) => {
  while (state.queue.length > 0) {
    const nextHintId = state.queue.shift();
    if (!nextHintId) {
      continue;
    }
    const nextEntry = ensureEntry(state, nextHintId);
    if (!nextEntry.dismissedForever) {
      state.activeHintId = nextHintId;
      return;
    }
  }
  state.activeHintId = null;
};

const isEligibleToShow = (
  entry: HintEntry,
  frequencyMs: number,
  now: number,
): boolean => {
  if (entry.dismissedForever) {
    return false;
  }
  if (entry.shownCount === 0) {
    return true;
  }
  if (frequencyMs <= 0) {
    return true;
  }
  if (entry.lastShownAt == null) {
    return true;
  }
  return now - entry.lastShownAt >= frequencyMs;
};

const ContextualHints = createSlice({
  name: 'contextualHints',
  initialState,
  reducers: {
    registerHint: (state, action: PayloadAction<HintActionPayload>) => {
      ensureEntry(state, action.payload.hintId);
    },
    unregisterHint: (state, action: PayloadAction<HintActionPayload>) => {
      const { hintId } = action.payload;

      state.queue = removeFromQueue(state.queue, hintId);
      if (state.activeHintId === hintId) {
        state.activeHintId = null;
        activateNextInQueue(state);
      }
    },
    requestHintPresentation: (
      state,
      action: PayloadAction<RequestHintPayload>,
    ) => {
      const { hintId, frequencyMs, now } = action.payload;
      const entry = ensureEntry(state, hintId);

      if (!isEligibleToShow(entry, frequencyMs, now)) {
        return;
      }
      if (state.activeHintId === hintId || state.queue.includes(hintId)) {
        return;
      }

      if (state.activeHintId == null) {
        state.activeHintId = hintId;
        return;
      }

      state.queue.push(hintId);
    },
    completeHintPresentation: (
      state,
      action: PayloadAction<CompleteHintPayload>,
    ) => {
      const { hintId, now } = action.payload;
      const entry = ensureEntry(state, hintId);

      if (state.activeHintId === hintId) {
        entry.shownCount += 1;
        entry.lastShownAt = now;
        state.activeHintId = null;
        activateNextInQueue(state);
      } else {
        state.queue = removeFromQueue(state.queue, hintId);
      }
    },
    dismissHintForever: (state, action: PayloadAction<HintActionPayload>) => {
      const { hintId } = action.payload;
      const entry = ensureEntry(state, hintId);

      entry.dismissedForever = true;
      state.queue = removeFromQueue(state.queue, hintId);

      if (state.activeHintId === hintId) {
        state.activeHintId = null;
        activateNextInQueue(state);
      }
    },
    resetHintRuntimeState: state => {
      state.activeHintId = null;
      state.queue = [];
    },
  },
});

export const {
  registerHint,
  unregisterHint,
  requestHintPresentation,
  completeHintPresentation,
  dismissHintForever,
  resetHintRuntimeState,
} = ContextualHints.actions;

export const selectActiveHintId = (state: RootState) =>
  state.contextualHints?.activeHintId ?? null;

export const selectHintEntryById =
  (hintId: string) =>
  (state: RootState): HintEntry | undefined =>
    state.contextualHints?.entries?.[hintId];

export const selectIsHintActive =
  (hintId: string) =>
  (state: RootState): boolean =>
    (state.contextualHints?.activeHintId ?? null) === hintId;

export default ContextualHints.reducer;
