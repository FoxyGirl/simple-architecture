import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ShowsState } from './types';

const EMPTY_STATE: ShowsState = {
  shows: [],
  page: 1,
  pageCount: 1,
  totalCount: 0,
  genres: [],
};

const showsSlice = createSlice({
  name: 'shows',
  initialState: EMPTY_STATE,
  reducers: {
    // The Entity only stores what a Task fetched: the whole search result
    // replaces the previous one, so superseded data can never linger.
    searchResultStored(_state, action: PayloadAction<ShowsState>): ShowsState {
      return action.payload;
    },
  },
});

export const { searchResultStored } = showsSlice.actions;
export const showsReducer = showsSlice.reducer;
