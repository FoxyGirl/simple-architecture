import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { FavoritesListPage, FavoritesSummary } from '@api/types';

import type { FavoritesState } from './types';

const EMPTY_STATE: FavoritesState = {
  ids: [],
  count: 0,
  list: null,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: EMPTY_STATE,
  reducers: {
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

export const { replaceFavoritesList, replaceFavoritesSummary } =
  favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
