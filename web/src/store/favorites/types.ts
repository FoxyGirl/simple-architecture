import type { FavoritesListPage } from '~/types';

/**
 * The favorites Entity state: the backend-synced mirror only. The favorite
 * `ids` and their backend-computed `count` — what the heart states read —
 * plus the current favorites `list` page, `null` until one was fetched.
 * The backend owns the favorites storage; the client mirrors it and holds
 * no authoritative data. No presentation state.
 */
export type FavoritesState = {
  ids: number[];
  count: number;
  list: FavoritesListPage | null;
};
