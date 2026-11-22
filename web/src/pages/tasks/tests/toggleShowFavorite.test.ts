import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import {
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectPendingFavoriteIds,
  store,
} from '~/store';
import { favoriteWrites, stubApi } from '~/test/api-mock';
import type { FavoritesSummary, Show } from '~/types';

import { toggleShowFavorite } from '../toggleShowFavorite';

// The Task under test is a plain async function, so the suite needs no React
// and no fetch stubbing: only the shared request boundary is replaced. The
// in-flight optimistic overlay lives in the sibling pending suite.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const added: FavoritesSummary = { count: 1, ids: [1] };
const cleared: FavoritesSummary = { count: 0, ids: [] };

describe('toggleShowFavorite task', () => {
  beforeEach(() => {
    api.mockReset();
    // Empty the Entity — every test starts from a clean favorites mirror.
    store.dispatch(replaceFavoritesSummary(cleared));
  });

  it('adds a non-favorite show through the backend', async () => {
    stubApi(api, { addFavorite: () => added });

    const result = await toggleShowFavorite(show(1, 'Show One'), false);

    expect(favoriteWrites(api)).toEqual([
      expect.objectContaining({
        path: '/api/favorites',
        method: 'POST',
        body: { show: show(1, 'Show One') },
      }),
    ]);
    expect(result).toEqual({ status: 'success', summary: added });
  });

  it('removes a favorited show through the backend', async () => {
    stubApi(api, { removeFavorite: () => cleared });

    const result = await toggleShowFavorite(show(1, 'Show One'), true);

    expect(favoriteWrites(api)).toEqual([
      expect.objectContaining({
        path: '/api/favorites/1',
        method: 'DELETE',
      }),
    ]);
    expect(result).toEqual({ status: 'success', summary: cleared });
  });

  it('stores the summary returned by the backend', async () => {
    stubApi(api, { addFavorite: () => added });

    await toggleShowFavorite(show(1, 'Show One'), false);

    expect(selectFavoriteIds(store.getState())).toEqual([1]);
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
  });

  it('clears the pending overlay and reports an immediate failure', async () => {
    stubApi(api, {
      addFavorite: () => {
        throw new Error('offline');
      },
    });

    const result = await toggleShowFavorite(show(1, 'Show One'), false);

    expect(result).toEqual({ status: 'error', message: 'offline' });
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
    expect(selectFavoriteIds(store.getState())).toEqual([]);
  });
});
