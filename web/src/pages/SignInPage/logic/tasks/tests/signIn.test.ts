import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import {
  clearSession,
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectSessionEmail,
  store,
} from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';

import { signIn } from '../signIn';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

describe('signIn', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
    store.dispatch(replaceFavoritesSummary({ count: 1, ids: [7] }));
  });

  it('POSTs the trimmed email, clears the favorites and stores the session', async () => {
    stubApi(api, { login: () => ({ email: 'ada@example.com' }) });

    const result = await signIn('  Ada@Example.com  ');

    expect(apiCalls(api)).toEqual([
      expect.objectContaining({
        path: '/api/auth/login',
        method: 'POST',
        body: { email: 'Ada@Example.com' },
      }),
    ]);
    expect(result).toEqual({
      status: 'success',
      session: { email: 'ada@example.com' },
    });
    expect(selectSessionEmail(store.getState())).toBe('ada@example.com');
    expect(selectFavoriteIds(store.getState())).toEqual([]);
  });

  it('a rejected login carries the backend message and dispatches nothing', async () => {
    stubApi(api, {
      login: () => {
        throw new ApiError('Request body must carry a valid "email"', 400);
      },
    });

    const result = await signIn('bad');

    expect(result).toEqual({
      status: 'error',
      message: 'Request body must carry a valid "email"',
    });
    expect(selectSessionEmail(store.getState())).toBeNull();
    expect(selectFavoriteIds(store.getState())).toEqual([7]);
  });
});
