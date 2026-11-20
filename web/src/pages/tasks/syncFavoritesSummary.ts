import { fetchFavoritesCount } from '~/api/favorites';
import { replaceFavoritesSummary, store } from '~/store';

import type { FavoritesSummaryResult } from './types';

/**
 * The favorites-summary Task: reads the current `{ count, ids }` summary
 * from the backend through the API layer and mirrors it into the favorites
 * Entity. It takes no arguments, never reads the store and only mutates
 * it through `store.dispatch`; the outcome is returned to the caller.
 */
export const syncFavoritesSummary =
  async (): Promise<FavoritesSummaryResult> => {
    try {
      const summary = await fetchFavoritesCount();

      store.dispatch(replaceFavoritesSummary(summary));

      return { status: 'success', summary };
    } catch {
      return { status: 'error' };
    }
  };
