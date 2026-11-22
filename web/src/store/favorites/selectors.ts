import type { RootState } from '../types';
import type { FavoritesState } from './types';

/** The backend favorite ids — the heart states read these. */
export const selectFavoriteIds = (state: RootState): FavoritesState['ids'] =>
  state.favorites.ids;

/** The number of favorite shows, derived from the backend ids. */
export const selectFavoritesCount = (state: RootState): number =>
  state.favorites.ids.length;

/** The show snapshots of the last fetched favorites page. */
export const selectFavoriteShows = (
  state: RootState,
): FavoritesState['shows'] => state.favorites.shows;

/** The backend total count of the last fetched favorites page. */
export const selectFavoritesTotalCount = (
  state: RootState,
): FavoritesState['totalCount'] => state.favorites.totalCount;

/** Whether a favorites list page has been fetched (the shows mirror is set). */
export const selectFavoritesHasLoaded = (state: RootState): boolean =>
  state.favorites.shows !== null;
