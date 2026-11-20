import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Show } from '~/api/types';

import { ApiError } from '../errors';
import {
  addFavoriteShow,
  fetchFavoritesCount,
  fetchFavoritesListPage,
  removeFavoriteShow,
} from '../favorites';

const fetchResponse = (
  body: unknown,
  { ok = true, status = 200 } = {},
): { ok: boolean; status: number; json: () => Promise<unknown> } => ({
  ok,
  status,
  json: async () => body,
});

const show = { id: 11, name: 'Show Eleven', genres: ['Drama'] } as Show;

const summary = { count: 1, ids: [11] };
const listPage = { shows: [show], page: 1, pageCount: 1, totalCount: 1 };

describe('api favorites', () => {
  let mockedFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('addFavoriteShow sends POST /api/favorites with the JSON show body', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(summary));

    await addFavoriteShow(show);

    expect(mockedFetch.mock.calls[0]?.[0]).toBe('/api/favorites');
    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ show }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('addFavoriteShow returns the parsed summary envelope', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(summary));

    await expect(addFavoriteShow(show)).resolves.toEqual(summary);
  });

  it('removeFavoriteShow sends DELETE /api/favorites/:id', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(summary));

    await expect(removeFavoriteShow(11)).resolves.toEqual(summary);

    expect(mockedFetch.mock.calls[0]?.[0]).toBe('/api/favorites/11');
    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });

  it('fetchFavoritesCount sends a GET to the count endpoint', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(summary));

    await expect(fetchFavoritesCount()).resolves.toEqual(summary);

    expect(mockedFetch.mock.calls[0]?.[0]).toBe('/api/favorites/count');
    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
  });

  it('fetchFavoritesListPage sends a GET with the page parameter', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(listPage));

    await expect(fetchFavoritesListPage(2)).resolves.toEqual(listPage);

    expect(mockedFetch.mock.calls[0]?.[0]).toBe('/api/favorites?page=2');
    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
  });

  it('normalizes a non-OK add response into an ApiError with the status', async () => {
    mockedFetch.mockResolvedValue(
      fetchResponse({ error: 'bad show' }, { ok: false, status: 400 }),
    );

    const error: unknown = await addFavoriteShow(show).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'ApiError', status: 400 });
  });

  it('normalizes a non-OK remove response into an ApiError', async () => {
    mockedFetch.mockResolvedValue(
      fetchResponse({ error: 'gone' }, { ok: false, status: 404 }),
    );

    await expect(removeFavoriteShow(99)).rejects.toThrow(ApiError);
  });
});
