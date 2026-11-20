import { fetchFavoritesListPage } from '~/api/favorites';
import { replaceFavoritesList, store } from '~/store';

import type { FavoritesListResult } from './types';

/**
 * The favorites-page Task: fetches one page of the backend favorites list
 * through the API layer and stores the envelope in the favorites Entity.
 * The requested page arrives as an explicit argument, the store is only
 * mutated through `store.dispatch`, and the outcome is returned to the
 * caller — the clamped page comes back inside the stored envelope.
 */
export const fetchFavoritesPage = async (
  page: number,
): Promise<FavoritesListResult> => {
  try {
    const list = await fetchFavoritesListPage(page);

    store.dispatch(replaceFavoritesList(list));

    return { status: 'success', list };
  } catch {
    return { status: 'error' };
  }
};
