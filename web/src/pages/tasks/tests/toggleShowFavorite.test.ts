import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addFavoriteShow, removeFavoriteShow } from '~/api/favorites';
import type { FavoritesSummary, Show } from '~/api/types';
import { replaceFavoritesSummary, selectFavoriteIds, store } from '~/store';

import { toggleShowFavorite } from '../toggleShowFavorite';

// The established boundary mock: the Task under test is a plain async
// function, so the suite needs no React and no fetch stubbing.
vi.mock('~/api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const added: FavoritesSummary = { count: 1, ids: [1] };
const cleared: FavoritesSummary = { count: 0, ids: [] };

describe('toggleShowFavorite task', () => {
  beforeEach(() => {
    vi.mocked(addFavoriteShow).mockReset();
    vi.mocked(removeFavoriteShow).mockReset();
    // Empty the Entity — every test starts from a clean favorites mirror.
    store.dispatch(replaceFavoritesSummary(cleared));
  });

  it('adds a non-favorite show through the API', async () => {
    vi.mocked(addFavoriteShow).mockResolvedValue(added);

    const result = await toggleShowFavorite(show(1, 'Show One'), false);

    expect(addFavoriteShow).toHaveBeenCalledWith(show(1, 'Show One'));
    expect(removeFavoriteShow).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'success', summary: added });
  });

  it('removes a favorited show through the API', async () => {
    vi.mocked(removeFavoriteShow).mockResolvedValue(cleared);

    const result = await toggleShowFavorite(show(1, 'Show One'), true);

    expect(removeFavoriteShow).toHaveBeenCalledWith(1);
    expect(addFavoriteShow).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'success', summary: cleared });
  });

  it('stores the summary returned by the backend', async () => {
    vi.mocked(addFavoriteShow).mockResolvedValue(added);

    await toggleShowFavorite(show(1, 'Show One'), false);

    expect(selectFavoriteIds(store.getState())).toEqual([1]);
  });

  it('dispatches nothing and reports the failure when the API fails', async () => {
    vi.mocked(addFavoriteShow).mockRejectedValue(new Error('offline'));

    const before = store.getState().favorites;
    const result = await toggleShowFavorite(show(1, 'Show One'), false);

    expect(result).toEqual({ status: 'error' });
    expect(store.getState().favorites).toBe(before);
  });
});
