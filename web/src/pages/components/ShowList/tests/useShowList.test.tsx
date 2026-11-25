import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import { replaceFavoritesSummary, selectFavoriteIds, store } from '~/store';
import { favoriteWrites, stubApi } from '~/test/api-mock';
import type { Show } from '~/types';

import { useShowList } from '../logic/useShowList';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const showSeven = show(7, 'Show Seven');

const emptySummary = { count: 0, ids: [] };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const renderList = () =>
  renderHook(() => useShowList({ shows: [] }), { wrapper });

describe('useShowList', () => {
  beforeEach(() => {
    store.dispatch(replaceFavoritesSummary(emptySummary));
    api.mockReset();
    stubApi(api, {
      addFavorite: () => ({ count: 1, ids: [7] }),
      removeFavorite: () => emptySummary,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reads the favorite state from the Entity when no props override it', () => {
    store.dispatch(replaceFavoritesSummary({ count: 2, ids: [1, 3] }));

    const { result } = renderList();

    expect(result.current.isFavorite(1)).toBe(true);
    expect(result.current.isFavorite(3)).toBe(true);
    expect(result.current.isFavorite(2)).toBe(false);
  });

  it('adds a show through the shared Task and mirrors the summary', async () => {
    const { result } = renderList();

    await act(async () => {
      await result.current.toggleFavorite(showSeven);
    });

    expect(favoriteWrites(api)).toEqual([
      expect.objectContaining({
        path: '/api/favorites',
        method: 'POST',
        body: { show: showSeven },
      }),
    ]);
    expect(selectFavoriteIds(store.getState())).toEqual([7]);
    expect(notify.success).toHaveBeenCalledOnce();
  });

  it('removes a stored favorite through the shared Task', async () => {
    store.dispatch(replaceFavoritesSummary({ count: 1, ids: [7] }));
    const { result } = renderList();

    await act(async () => {
      await result.current.toggleFavorite(showSeven);
    });

    expect(favoriteWrites(api)).toEqual([
      expect.objectContaining({
        path: '/api/favorites/7',
        method: 'DELETE',
      }),
    ]);
    expect(selectFavoriteIds(store.getState())).toEqual([]);
    expect(notify.info).toHaveBeenCalledOnce();
  });

  it('prefers the injected favorites aspect over the Entity', async () => {
    const isFavorite = vi.fn(() => true);
    const onToggleFavorite = vi.fn();
    const { result } = renderHook(
      () => useShowList({ shows: [], isFavorite, onToggleFavorite }),
      { wrapper },
    );

    expect(result.current.isFavorite(999)).toBe(true);

    await act(async () => {
      result.current.toggleFavorite(showSeven);
    });

    expect(onToggleFavorite).toHaveBeenCalledWith(showSeven);
    expect(favoriteWrites(api)).toEqual([]);
    expect(notify.success).not.toHaveBeenCalled();
  });
});
