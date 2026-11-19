import type { FavoritesListPage, FavoritesSummary } from '@api/types';

/**
 * The outcome of the syncFavoritesSummary Task, returned to the caller.
 * `'success'` carries the summary that was dispatched into the Entity.
 */
export type FavoritesSummaryResult =
  { status: 'success'; summary: FavoritesSummary } | { status: 'error' };

/**
 * The outcome of the fetchFavoritesPage Task; `'success'` carries the
 * page envelope that was dispatched into the Entity.
 */
export type FavoritesListResult =
  { status: 'success'; list: FavoritesListPage } | { status: 'error' };
