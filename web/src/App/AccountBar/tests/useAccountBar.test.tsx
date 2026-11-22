import { act, cleanup, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import {
  clearSession,
  replaceFavoritesSummary,
  replaceSession,
  selectFavoriteIds,
  selectSessionEmail,
  store,
} from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';

import { useAccountBar } from '../logic/useAccountBar';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const renderBar = (onSignIn = vi.fn()) =>
  renderHook(() => useAccountBar({ onSignIn }), { wrapper });

describe('useAccountBar', () => {
  beforeEach(() => {
    api.mockReset();
    vi.mocked(notify.error).mockClear();
    store.dispatch(clearSession());
    store.dispatch(replaceFavoritesSummary({ count: 0, ids: [] }));
  });

  afterEach(() => {
    cleanup();
  });

  it('exposes the guest account while signed out', () => {
    const { result } = renderBar();

    expect(result.current.account).toEqual({ kind: 'guest' });
  });

  it('forwards the Sign in handler owned by App', () => {
    const onSignIn = vi.fn();
    const { result } = renderBar(onSignIn);

    result.current.onSignIn();

    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('exposes the signed-in email and logs out through the Task', async () => {
    store.dispatch(replaceSession({ email: 'ada@example.com' }));
    store.dispatch(replaceFavoritesSummary({ count: 1, ids: [7] }));
    stubApi(api, { logout: () => ({ email: null }) });
    const { result } = renderBar();

    expect(result.current.account).toEqual({
      kind: 'user',
      email: 'ada@example.com',
    });

    await act(async () => {
      await result.current.onLogout();
    });

    expect(apiCalls(api)).toEqual([
      expect.objectContaining({ path: '/api/auth/logout', method: 'POST' }),
    ]);
    expect(selectSessionEmail(store.getState())).toBeNull();
    expect(selectFavoriteIds(store.getState())).toEqual([]);
  });

  it('keeps the session and reports a failed logout', async () => {
    store.dispatch(replaceSession({ email: 'ada@example.com' }));
    stubApi(api, {
      logout: () => {
        throw new ApiError('Logout failed', 500);
      },
    });
    const { result } = renderBar();

    await act(async () => {
      await result.current.onLogout();
    });

    expect(selectSessionEmail(store.getState())).toBe('ada@example.com');
    expect(notify.error).toHaveBeenCalledWith('Logout failed');
  });
});
