import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { selectFavoriteShows, selectFavoritesTotalCount, store } from '~/store';
import { favoritesPageRequests, stubApi } from '~/test/api-mock';
import type { FavoritesListPage, Show } from '~/types';

import { fetchFavoritesPage } from '../fetchFavoritesPage';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const listPage: FavoritesListPage = {
  shows: [{ id: 1, name: 'Show One', genres: ['Drama'] } as Show],
  page: 2,
  pageCount: 2,
  totalCount: 4,
};

describe('fetchFavoritesPage task', () => {
  beforeEach(() => {
    api.mockReset();
  });

  it('fetches the requested page and stores its shows and total count in the Entity', async () => {
    stubApi(api, { favoritesPage: () => listPage });

    const result = await fetchFavoritesPage(2);

    expect(favoritesPageRequests(api)).toEqual([2]);
    expect(result).toEqual({ status: 'success', list: listPage });
    expect(selectFavoriteShows(store.getState())).toEqual(listPage.shows);
    expect(selectFavoritesTotalCount(store.getState())).toBe(
      listPage.totalCount,
    );
  });

  it('dispatches nothing and reports the failure when the request fails', async () => {
    stubApi(api, {
      favoritesPage: () => {
        throw new Error('offline');
      },
    });

    const before = store.getState().favorites;
    const result = await fetchFavoritesPage(1);

    expect(result).toEqual({ status: 'error', message: 'offline' });
    expect(store.getState().favorites).toBe(before);
  });
});
