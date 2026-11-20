import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import { replaceFavoritesSummary, store } from '~/store';
import type { FavoritesSummary, Show } from '~/types';

import type { FavoritesSummaryResult } from './types';

/**
 * The write operations of this Task: the backend owns the favorites storage,
 * so add and remove answer with the updated `{ count, ids }` summary the
 * caller mirrors without refetching.
 */
const addFavoriteShow = (show: Show): Promise<FavoritesSummary> =>
  requestJson<FavoritesSummary>(buildApiUrl('/api/favorites'), {
    method: 'POST',
    body: { show },
  });

const removeFavoriteShow = (id: number): Promise<FavoritesSummary> =>
  requestJson<FavoritesSummary>(buildApiUrl(`/api/favorites/${id}`), {
    method: 'DELETE',
  });

/**
 * The favorite-toggle Task, shared by the home-page cards and the
 * Favorites page: the toggle goes through the request layer and the
 * `{ count, ids }` summary the response carries is dispatched into the
 * Entity. The current favorite state arrives through the explicit
 * `isFavorite` argument — the Task never reads the store, it only mutates
 * it through `store.dispatch`; the outcome is returned for the caller
 * (toasts build on it).
 */
export const toggleShowFavorite = async (
  show: Show,
  isFavorite: boolean,
): Promise<FavoritesSummaryResult> => {
  try {
    const summary = isFavorite
      ? await removeFavoriteShow(show.id)
      : await addFavoriteShow(show);

    store.dispatch(replaceFavoritesSummary(summary));

    return { status: 'success', summary };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
};
