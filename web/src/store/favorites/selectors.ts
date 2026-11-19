import type { RootState } from '../types';
import type { FavoritesState } from './types';

/** The favorited shows, in the order they were added (legacy client-side). */
export const selectFavoriteShows = (
  state: RootState,
): FavoritesState['shows'] => state.favorites.shows;

/** The backend favorite ids — the heart states read these. */
export const selectFavoriteIds = (state: RootState): FavoritesState['ids'] =>
  state.favorites.ids;

/** The backend-computed number of favorite shows. */
export const selectFavoritesCount = (
  state: RootState,
): FavoritesState['count'] => state.favorites.count;

/** The current backend favorites list page, `null` until one was fetched. */
export const selectFavoritesList = (state: RootState): FavoritesState['list'] =>
  state.favorites.list;
