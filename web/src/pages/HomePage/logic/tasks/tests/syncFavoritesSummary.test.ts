import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { selectFavoriteIds, selectFavoritesCount, store } from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';
import type { FavoritesSummary } from '~/types';

import { syncFavoritesSummary } from '../syncFavoritesSummary';

// The established boundary mock: the Task under test is a plain function,
// so the suite needs no React and no fetch stubbing.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const summary: FavoritesSummary = { count: 2, ids: [3, 7] };

describe('syncFavoritesSummary task', () => {
  beforeEach(() => {
    api.mockReset();
  });

  it('fetches the summary and dispatches it into the Entity', async () => {
    stubApi(api, { favoritesCount: () => summary });

    const result = await syncFavoritesSummary();

    expect(apiCalls(api)).toEqual([
      expect.objectContaining({
        path: '/api/favorites/count',
        method: 'GET',
      }),
    ]);
    expect(result).toEqual({ status: 'success', summary });
    expect(selectFavoriteIds(store.getState())).toEqual([3, 7]);
    expect(selectFavoritesCount(store.getState())).toBe(2);
  });

  it('dispatches nothing and reports the failure when the request fails', async () => {
    stubApi(api, {
      favoritesCount: () => {
        throw new Error('offline');
      },
    });

    const before = store.getState().favorites;
    const result = await syncFavoritesSummary();

    expect(result).toEqual({ status: 'error', message: 'offline' });
    expect(store.getState().favorites).toBe(before);
  });
});
