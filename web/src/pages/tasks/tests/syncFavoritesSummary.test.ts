import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesCount } from '~/api/favorites';
import type { FavoritesSummary } from '~/api/types';
import { selectFavoriteIds, selectFavoritesCount, store } from '~/store';

import { syncFavoritesSummary } from '../syncFavoritesSummary';

// The established boundary mock: the Task under test is a plain function,
// so the suite needs no React and no fetch stubbing.
vi.mock('~/api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

const summary: FavoritesSummary = { count: 2, ids: [3, 7] };

describe('syncFavoritesSummary task', () => {
  beforeEach(() => {
    vi.mocked(fetchFavoritesCount).mockReset();
  });

  it('fetches the summary and dispatches it into the Entity', async () => {
    vi.mocked(fetchFavoritesCount).mockResolvedValue(summary);

    const result = await syncFavoritesSummary();

    expect(result).toEqual({ status: 'success', summary });
    expect(selectFavoriteIds(store.getState())).toEqual([3, 7]);
    expect(selectFavoritesCount(store.getState())).toBe(2);
  });

  it('dispatches nothing and reports the failure when the API fails', async () => {
    vi.mocked(fetchFavoritesCount).mockRejectedValue(new Error('offline'));

    const before = store.getState().favorites;
    const result = await syncFavoritesSummary();

    expect(result).toEqual({ status: 'error' });
    expect(store.getState().favorites).toBe(before);
  });
});
