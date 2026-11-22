import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

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
    expect(result.current.isAuthModalOpen).toBe(false);
  });

  it('opens and closes the sign-in modal', async () => {
    stubApi(api, { authMe: () => ({ email: null }) });

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.isAuthModalOpen).toBe(false);

    act(() => result.current.openAuthModal());
    expect(result.current.isAuthModalOpen).toBe(true);

    act(() => result.current.closeAuthModal());
    expect(result.current.isAuthModalOpen).toBe(false);

    await waitFor(() => expect(result.current.isSessionReady).toBe(true));
  });
});
