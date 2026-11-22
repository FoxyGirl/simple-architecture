import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import {
  clearSession,
  replaceFavoritesSummary,
  replaceSession,
  selectFavoriteIds,
  selectSessionEmail,
  store,
} from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';

import { logout } from '../logout';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const signIn = () => {
  store.dispatch(replaceSession({ email: 'ada@example.com' }));
  store.dispatch(replaceFavoritesSummary({ count: 1, ids: [7] }));
};

describe('logout', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
  });

  it('POSTs the logout then clears the session and the favorites', async () => {
    signIn();
    stubApi(api, { logout: () => ({ email: null }) });

    const result = await logout();

    expect(apiCalls(api)).toEqual([
      expect.objectContaining({ path: '/api/auth/logout', method: 'POST' }),
    ]);
    expect(result).toEqual({ status: 'success' });
    expect(selectSessionEmail(store.getState())).toBeNull();
    expect(selectFavoriteIds(store.getState())).toEqual([]);
  });

  it('a failed logout dispatches nothing and reports the message', async () => {
    signIn();
    stubApi(api, {
      logout: () => {
        throw new ApiError('Logout failed', 500);
      },
    });

    const result = await logout();

    expect(result).toEqual({ status: 'error', message: 'Logout failed' });
    expect(selectSessionEmail(store.getState())).toBe('ada@example.com');
    expect(selectFavoriteIds(store.getState())).toEqual([7]);
  });
});
