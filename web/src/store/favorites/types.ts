import type { FavoritesListPage, Show } from '@api/types';

/**
 * The favorites Entity state. The legacy client-side `shows` list (the
 * Favorites-page data until the backend migration) lives beside the
 * backend-synced mirror: the favorite `ids` and their backend-computed
 * `count` — what the heart states read — plus the current favorites
 * `list` page, `null` until one was fetched. No presentation state.
 */
export type FavoritesState = {
  shows: Show[];
  ids: number[];
  count: number;
  list: FavoritesListPage | null;
};
