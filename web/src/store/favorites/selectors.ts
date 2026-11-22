import type { RootState } from '../types';
import type { FavoritesState } from './types';

/**
 * The effective favorite ids — what the heart states read: the backend
 * mirror force-overlaid with the in-flight toggles, so a pending add is
 * present (even when a concurrently replaced summary predates it on the
 * backend) and a pending remove is absent. Settling a toggle restores the
 * verbatim mirror.
 */
export const selectFavoriteIds = (state: RootState): FavoritesState['ids'] => {
  const { ids, pendingToggles } = state.favorites;

  const retained = ids.filter((id) => pendingToggles[id] !== false);
  const added = Object.keys(pendingToggles)
    .map(Number)
    .filter((id) => pendingToggles[id] === true && !ids.includes(id));

  return [...retained, ...added];
};

/** The number of favorite shows, derived from the effective ids. */
export const selectFavoritesCount = (state: RootState): number =>
  selectFavoriteIds(state).length;

/** The show ids whose toggle write is currently in flight. */
export const selectPendingFavoriteIds = (state: RootState): number[] =>
  Object.keys(state.favorites.pendingToggles).map(Number);

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
