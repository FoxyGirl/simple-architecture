import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import { replaceFavoritesListSnapshot, store } from '~/store';
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
 * through the request layer, stores the envelope's backend-owned part (the
 * shows and the total count) in the favorites Entity and returns the
 * envelope to the caller — the Presenter derives the page metadata from it.
 * The requested page arrives as an explicit argument, the store is only
 * mutated through `store.dispatch`.
 */
export const fetchFavoritesPage = async (
  page: number,
): Promise<FavoritesListResult> => {
  try {
    const list = await fetchFavoritesListPage(page);

    store.dispatch(
      replaceFavoritesListSnapshot({
        shows: list.shows,
        totalCount: list.totalCount,
      }),
    );

    return { status: 'success', list };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
};
