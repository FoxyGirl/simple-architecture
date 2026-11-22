import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import {
  clearSession,
  replaceFavoritesSummary,
  replaceSession,
  selectFavoriteIds,
  selectIsAuthenticated,
  selectSessionEmail,
  store,
} from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';

import { restoreSession } from '../restoreSession';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

describe('restoreSession', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
    store.dispatch(replaceFavoritesSummary({ count: 1, ids: [7] }));
  });

  it('restores the session from GET /api/auth/me', async () => {
    stubApi(api, { authMe: () => ({ email: 'ada@example.com' }) });

    const result = await restoreSession();

    expect(apiCalls(api)).toEqual([
      expect.objectContaining({ path: '/api/auth/me', method: 'GET' }),
    ]);
    expect(result).toEqual({
      status: 'success',
      session: { email: 'ada@example.com' },
    });
    expect(selectSessionEmail(store.getState())).toBe('ada@example.com');
    expect(selectIsAuthenticated(store.getState())).toBe(true);
    expect(selectFavoriteIds(store.getState())).toEqual([7]);
  });

  it('a 401 clears the session and the favorites without throwing', async () => {
    stubApi(api, {
      authMe: () => {
        throw new ApiError('Authentication required', 401);
      },
    });
    store.dispatch(replaceSession({ email: 'old@example.com' }));

    const result = await restoreSession();

    expect(result).toEqual({
      status: 'error',
      message: 'Authentication required',
    });
    expect(selectSessionEmail(store.getState())).toBeNull();
    expect(selectFavoriteIds(store.getState())).toEqual([]);
  });

  it('a network failure also clears both entities', async () => {
    stubApi(api, {
      authMe: () => {
        throw new Error('fetch failed');
      },
    });

    const result = await restoreSession();

    expect(result).toEqual({ status: 'error', message: 'fetch failed' });
    expect(selectSessionEmail(store.getState())).toBeNull();
    expect(selectFavoriteIds(store.getState())).toEqual([]);
  });
});
