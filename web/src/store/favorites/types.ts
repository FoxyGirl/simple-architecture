import type { Show } from '~/types';

/**
 * The favorites Entity state: the backend-synced mirror only. The favorite
 * `ids` — what the heart states read — plus the shows and total count of the
 * last fetched favorites page. The backend owns the favorites storage; the
 * client mirrors it and holds no authoritative data. The page metadata of
 * that fetch (page and page count) lives in the Favorites page Presenter,
 * not here. No presentation state.
 */
export type FavoritesState = {
  ids: number[];
  shows: Show[] | null;
  totalCount: number;
};
