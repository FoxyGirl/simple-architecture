import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesListPage } from '@api/favorites';
import type { FavoritesListPage, Show } from '@api/types';
import { selectFavoritesList, store } from '@store';

import { fetchFavoritesPage } from '../fetchFavoritesPage';

vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

const listPage: FavoritesListPage = {
  shows: [{ id: 1, name: 'Show One', genres: ['Drama'] } as Show],
  page: 2,
  pageCount: 2,
  totalCount: 4,
};

describe('fetchFavoritesPage task', () => {
  beforeEach(() => {
    vi.mocked(fetchFavoritesListPage).mockReset();
  });

  it('fetches the requested page and stores the envelope in the Entity', async () => {
    vi.mocked(fetchFavoritesListPage).mockResolvedValue(listPage);

    const result = await fetchFavoritesPage(2);

    expect(fetchFavoritesListPage).toHaveBeenCalledWith(2);
    expect(result).toEqual({ status: 'success', list: listPage });
    expect(selectFavoritesList(store.getState())).toEqual(listPage);
  });

  it('dispatches nothing and reports the failure when the API fails', async () => {
    vi.mocked(fetchFavoritesListPage).mockRejectedValue(new Error('offline'));

    const before = store.getState().favorites;
    const result = await fetchFavoritesPage(1);

    expect(result).toEqual({ status: 'error' });
    expect(store.getState().favorites).toBe(before);
  });
});
