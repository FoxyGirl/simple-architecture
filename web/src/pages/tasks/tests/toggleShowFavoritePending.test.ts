import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import {
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectPendingFavoriteIds,
  store,
} from '~/store';
import { stubApi } from '~/test/api-mock';
import type { FavoritesSummary, Show } from '~/types';

import { toggleShowFavorite } from '../toggleShowFavorite';

// The optimistic overlay while a write is in flight: the Task marks the
// toggle pending before the request and settles it when the gated response
// arrives — or rolls the overlay back when it fails.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const added: FavoritesSummary = { count: 1, ids: [1] };
const cleared: FavoritesSummary = { count: 0, ids: [] };

// A write response that never settles until the test opens the gate.
const deferredSummary = () => {
  let resolve!: (summary: FavoritesSummary) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<FavoritesSummary>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('toggleShowFavorite pending overlay', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(replaceFavoritesSummary(cleared));
  });

  it('marks the toggle pending before the request and settles it after', async () => {
    const gate = deferredSummary();
    stubApi(api, { addFavorite: () => gate.promise });

    const running = toggleShowFavorite(show(1, 'Show One'), false);

    // Before the response: the overlay shows the optimistic add.
    expect(selectPendingFavoriteIds(store.getState())).toEqual([1]);
    expect(selectFavoriteIds(store.getState())).toEqual([1]);

    gate.resolve(added);
    const result = await running;

    expect(result).toEqual({ status: 'success', summary: added });
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
    expect(selectFavoriteIds(store.getState())).toEqual([1]);
  });

  it('rolls the overlay back when a held request fails', async () => {
    store.dispatch(replaceFavoritesSummary(added));
    const gate = deferredSummary();
    stubApi(api, { removeFavorite: () => gate.promise });

    const running = toggleShowFavorite(show(1, 'Show One'), true);
    expect(selectFavoriteIds(store.getState())).toEqual([]);

    gate.reject(new Error('offline'));
    const result = await running;

    expect(result).toEqual({ status: 'error', message: 'offline' });
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
    expect(selectFavoriteIds(store.getState())).toEqual([1]);
  });
});
