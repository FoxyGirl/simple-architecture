import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import type { FavoritesSummaryResult } from '~/pages/tasks/types';
import { replaceFavoritesSummary, store } from '~/store';
import type { FavoritesSummary } from '~/types';

/**
 * The read operation of this Task: the backend serves the current
 * `{ count, ids }` summary the hearts and the count button mirror.
 */
const fetchFavoritesCount = (): Promise<FavoritesSummary> =>
  requestJson<FavoritesSummary>(buildApiUrl('/api/favorites/count'));

/**
 * The favorites-summary Task: reads the current `{ count, ids }` summary
 * from the backend through the request layer and mirrors it into the
 * favorites Entity. It takes no arguments, never reads the store and only
 * mutates it through `store.dispatch`; the outcome is returned to the caller.
 */
export const syncFavoritesSummary =
  async (): Promise<FavoritesSummaryResult> => {
    try {
      const summary = await fetchFavoritesCount();

      store.dispatch(replaceFavoritesSummary(summary));

      return { status: 'success', summary };
    } catch (error) {
      return { status: 'error', message: toErrorMessage(error) };
    }
  };
