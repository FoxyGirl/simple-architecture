import { buildApiUrl, requestJson } from './request';

import type { FavoritesListPage, FavoritesSummary, Show } from './types';

/**
 * The favorites calls over the backend, which owns the favorites storage.
 * Add and remove answer with the updated `{ count, ids }` summary so the
 * caller can sync without refetching; URL building, JSON handling and
 * error normalization live in the request layer.
 */
export const addFavoriteShow = (show: Show): Promise<FavoritesSummary> =>
  requestJson<FavoritesSummary>(buildApiUrl('/api/favorites'), {
    method: 'POST',
    body: { show },
  });

export const removeFavoriteShow = (id: number): Promise<FavoritesSummary> =>
  requestJson<FavoritesSummary>(buildApiUrl(`/api/favorites/${id}`), {
    method: 'DELETE',
  });

export const fetchFavoritesCount = (): Promise<FavoritesSummary> =>
  requestJson<FavoritesSummary>(buildApiUrl('/api/favorites/count'));

export const fetchFavoritesListPage = (
  page: number,
): Promise<FavoritesListPage> =>
  requestJson<FavoritesListPage>(
    buildApiUrl('/api/favorites', [['page', page]]),
  );
