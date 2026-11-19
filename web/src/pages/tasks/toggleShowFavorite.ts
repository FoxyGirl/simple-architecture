import { addFavoriteShow, removeFavoriteShow } from '@api/favorites';
import type { Show } from '@api/types';
import { replaceFavoritesSummary, store } from '@store';

import type { FavoritesSummaryResult } from './types';

/**
 * The favorite-toggle Task, shared by the home-page cards and the
 * Favorites page: the backend owns the favorites storage, so the toggle
 * goes through the API layer and the `{ count, ids }` summary the response
 * carries is dispatched into the Entity. The current favorite state
 * arrives through the explicit `isFavorite` argument — the Task never
 * reads the store, it only mutates it through `store.dispatch`; the
 * outcome is returned for the caller (toasts build on it).
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
  } catch {
    return { status: 'error' };
  }
};
