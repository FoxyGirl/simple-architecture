import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { FavoritesListSnapshot, FavoritesSummary } from '~/types';

import type { FavoritesState, PendingToggle } from './types';

const EMPTY_STATE: FavoritesState = {
  ids: [],
  pendingToggles: {},
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
    // The optimistic overlay of the in-flight toggles is applied on top of
    // the verbatim ids by the selectors, never stored into them.
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
    // Transient overlay: the toggle Task marks a write in flight with its
    // optimistic target and settles it when the request completes — a
    // success replaces the ids with the backend summary, a failure simply
    // drops the mark, which restores the mirrored ids (the rollback).
    beginFavoriteToggle(state, action: PayloadAction<PendingToggle>) {
      state.pendingToggles[action.payload.id] = action.payload.target;
    },
    settleFavoriteToggle(state, action: PayloadAction<number>) {
      delete state.pendingToggles[action.payload];
    },
  },
});

export const {
  beginFavoriteToggle,
  replaceFavoritesListSnapshot,
  replaceFavoritesSummary,
  settleFavoriteToggle,
} = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
