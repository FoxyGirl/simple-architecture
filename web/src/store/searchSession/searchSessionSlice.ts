import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { SearchSession } from './types';

// `null` until a search succeeded in this app session; the HomePage reads
// it on mount to restore the view, never to trigger a new-search reset.
const searchSessionSlice = createSlice({
  name: 'searchSession',
  initialState: null as SearchSession | null,
  reducers: {
    // The Task reports the search that actually succeeded, so the stored
    // selection always describes the result the shows Entity holds.
    replaceSearchSession(
      _state,
      action: PayloadAction<SearchSession | null>,
    ): SearchSession | null {
      return action.payload;
    },
  },
});

export const { replaceSearchSession } = searchSessionSlice.actions;
export const searchSessionReducer = searchSessionSlice.reducer;
