import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { FavoritesListSnapshot, FavoritesSummary } from '~/types';

import type { FavoritesState } from './types';

const EMPTY_STATE: FavoritesState = {
  ids: [],
  shows: null,
  totalCount: 0,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: EMPTY_STATE,
  reducers: {
    // Backend-synced state: the summary and the backend-owned part of the
    // fetched list envelope store their payloads verbatim — the backend is
    // the source of truth, so nothing is merged or recomputed client-side.
    // The count is derived from the ids by the selector.
    replaceFavoritesSummary(state, action: PayloadAction<FavoritesSummary>) {
      state.ids = action.payload.ids;
    },
    replaceFavoritesListSnapshot(
      state,
      action: PayloadAction<FavoritesListSnapshot>,
    ) {
      state.shows = action.payload.shows;
      state.totalCount = action.payload.totalCount;
    },
  },
});

export const { replaceFavoritesListSnapshot, replaceFavoritesSummary } =
  favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
