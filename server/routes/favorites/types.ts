import type { Show } from '@server/types';

/** The add/remove/count response: the current favorites in storage order. */
export type FavoritesSummary = {
  count: number;
  ids: number[];
};

/** The `GET /api/favorites` list envelope, mirroring the search page shape. */
export type FavoritesListPage = {
  shows: Show[];
  page: number;
  pageCount: number;
  totalCount: number;
};
