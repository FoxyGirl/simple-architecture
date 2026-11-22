import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import {
  beginFavoriteToggle,
  replaceFavoritesSummary,
  settleFavoriteToggle,
  store,
} from '~/store';
import { stubApi } from '~/test/api-mock';

import { useShowList } from '../logic/useShowList';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

const emptySummary = { count: 0, ids: [] };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useShowList pending favorite toggles', () => {
  beforeEach(() => {
    store.dispatch(replaceFavoritesSummary(emptySummary));
    store.dispatch(settleFavoriteToggle(7));
    api.mockReset();
    stubApi(api);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reports the in-flight ids of the stored favorites path', () => {
    act(() => {
      store.dispatch(beginFavoriteToggle({ id: 7, target: true }));
    });

    const { result } = renderHook(() => useShowList({ shows: [] }), {
      wrapper,
    });

    expect(result.current.isPending(7)).toBe(true);
    expect(result.current.isPending(8)).toBe(false);

    act(() => {
      store.dispatch(settleFavoriteToggle(7));
    });

    expect(result.current.isPending(7)).toBe(false);
  });

  it('reports the same pending registry for an injected favorites aspect', () => {
    act(() => {
      store.dispatch(beginFavoriteToggle({ id: 7, target: false }));
    });

    const { result } = renderHook(
      () =>
        useShowList({
          shows: [],
          isFavorite: () => true,
          onToggleFavorite: () => {},
        }),
      { wrapper },
    );

    expect(result.current.isPending(7)).toBe(true);

    act(() => {
      store.dispatch(settleFavoriteToggle(7));
    });

    expect(result.current.isPending(7)).toBe(false);
  });
});
