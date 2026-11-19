import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { FavoritesListPage, FavoritesSummary, Show } from '@api/types';

import type { FavoritesState } from './types';

const EMPTY_STATE: FavoritesState = {
  shows: [],
  ids: [],
  count: 0,
  list: null,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: EMPTY_STATE,
  reducers: {
    // Adding an already-favorited show is a no-op, so the list can never
    // hold duplicates no matter how often the Task runs.
    addFavorite(state, action: PayloadAction<Show>) {
      const alreadyStored = state.shows.some(
        (show) => show.id === action.payload.id,
      );
      if (!alreadyStored) state.shows.push(action.payload);
    },
    removeFavorite(state, action: PayloadAction<number>) {
      state.shows = state.shows.filter((show) => show.id !== action.payload);
    },
    // Backend-synced state: the summary and the list page store their
    // payloads verbatim — the backend is the source of truth, so nothing
    // is merged or recomputed client-side.
    replaceFavoritesSummary(state, action: PayloadAction<FavoritesSummary>) {
      state.ids = action.payload.ids;
      state.count = action.payload.count;
    },
    replaceFavoritesList(state, action: PayloadAction<FavoritesListPage>) {
      state.list = action.payload;
    },
  },
});

export const {
  addFavorite,
  removeFavorite,
  replaceFavoritesList,
  replaceFavoritesSummary,
} = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
