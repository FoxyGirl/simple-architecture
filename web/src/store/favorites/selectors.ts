import type { RootState } from '../types';
import type { FavoritesState } from './types';

/** The favorited shows, in the order they were added. */
export const selectFavoriteShows = (
  state: RootState,
): FavoritesState['shows'] => state.favorites.shows;
