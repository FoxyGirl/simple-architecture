import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import { replaceFavoritesList, store } from '~/store';
import type { FavoritesListPage } from '~/types';

import type { FavoritesListResult } from '../../types';

/**
 * The read operation of this Task: the backend serves one favorites list
 * page with its pagination metadata.
 */
const fetchFavoritesListPage = (page: number): Promise<FavoritesListPage> =>
  requestJson<FavoritesListPage>(
    buildApiUrl('/api/favorites', [['page', page]]),
  );

/**
 * The favorites-page Task: fetches one page of the backend favorites list
 * through the request layer and stores the envelope in the favorites Entity.
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
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
};
