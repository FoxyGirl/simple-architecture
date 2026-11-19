import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Show } from '@api/types';

import type { FavoritesState } from './types';

const EMPTY_STATE: FavoritesState = {
  shows: [],
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
  },
});

export const { addFavorite, removeFavorite } = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
