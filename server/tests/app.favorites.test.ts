import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteFavorite,
  getFavoriteCount,
  getFavoritesPage,
  login,
  postFavorite,
  resetStores,
  show,
} from './favorites-probe';

const EMAIL = 'ada@example.com';

describe('favorites API', () => {
  let cookie: string;
  let mockedFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Reset both in-memory seams (as `cache`); the mocked fetch lets the
    // suites prove favorites never reach TVmaze.
    resetStores();
    cookie = await login(EMAIL);
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POST /api/favorites adds the show and returns the updated summary', async () => {
    const first = await postFavorite(cookie, 11);

    expect(first.status).toBe(200);
    expect(first.body).toEqual({ count: 1, ids: [11] });

    const second = await postFavorite(cookie, 12);

    expect(second.body).toEqual({ count: 2, ids: [11, 12] });
  });

  it('GET /api/favorites/count reflects the adds and the removes', async () => {
    await postFavorite(cookie, 11);
    await postFavorite(cookie, 12);
    await deleteFavorite(cookie, 11);

    const response = await getFavoriteCount(cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 1, ids: [12] });
  });

  it('GET /api/favorites serves the second slice with correct metadata', async () => {
    for (const id of [11, 12, 13, 14]) await postFavorite(cookie, id);

    const response = await getFavoritesPage(cookie, 2);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      shows: [show(14)],
      page: 2,
      pageCount: 2,
      totalCount: 4,
    });
  });

  it('DELETE /api/favorites/:id removes the show and returns the summary', async () => {
    await postFavorite(cookie, 11);
    await postFavorite(cookie, 12);

    const removed = await deleteFavorite(cookie, 11);

    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ count: 1, ids: [12] });
  });

  it('serves favorites without any upstream TVmaze call', async () => {
    await postFavorite(cookie, 11);
    await getFavoriteCount(cookie);
    await getFavoritesPage(cookie, 1);
    await deleteFavorite(cookie, 11);

    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
