import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import { clearSession, store } from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';

import { useApp } from '../logic/useApp';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

type AppEntry = string | { pathname: string; state?: unknown };

// The App presenter reads the route state, so the wrapper mounts a router.
const wrapperFor = (entry: AppEntry) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
      </Provider>
    );
  };

const wrapper = wrapperFor('/');

describe('useApp', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
  });

  afterEach(() => {
    cleanup();
  });

  it('restores the session on mount and reports readiness', async () => {
    stubApi(api, { authMe: () => ({ email: 'ada@example.com' }) });

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.isSessionReady).toBe(false);

    await waitFor(() => expect(result.current.isSessionReady).toBe(true));

    expect(result.current.isAuthenticated).toBe(true);
    expect(apiCalls(api)).toEqual([
      expect.objectContaining({ path: '/api/auth/me', method: 'GET' }),
    ]);
  });

  it('a failed restore settles signed out', async () => {
    stubApi(api, {
      authMe: () => {
        throw new ApiError('Authentication required', 401);
      },
    });

    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => expect(result.current.isSessionReady).toBe(true));

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('prepares the favorites exit from the carried home URL', () => {
    stubApi(api, { authMe: () => ({ email: 'ada@example.com' }) });

    const { result } = renderHook(() => useApp(), {
      wrapper: wrapperFor({
        pathname: '/favorites',
        state: { fromHome: '/?search=ban&genre=Comedy&page=2' },
      }),
    });

    expect(result.current.favoritesExit).toBe(
      '/?search=ban&genre=Comedy&page=2',
    );
  });

  it('exits to the bare home without a carried URL', () => {
    stubApi(api, {
      authMe: () => {
        throw new ApiError('Authentication required', 401);
      },
    });

    const { result } = renderHook(() => useApp(), {
      wrapper: wrapperFor('/favorites'),
    });

    expect(result.current.favoritesExit).toBe('/');
  });
});
