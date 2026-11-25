import request from 'supertest';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { createApp } from '@server/app';
import { cache } from '@server/cache';

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body));

const result = (id: number, name: string, genres: string[], score: number) => ({
  score,
  show: { id, name, genres },
});

// 7 shows, 4 of them Drama: 3 unfiltered pages, genre=Drama fits 2 pages.
const searchFixture = [
  result(11, 'Drama A', ['Drama', 'Crime'], 9),
  result(12, 'Comedy B', ['Comedy'], 8),
  result(13, 'Drama C', ['Drama'], 7),
  result(14, 'Romance D', ['Comedy', 'Romance'], 6),
  result(15, 'Fantasy E', ['Drama', 'Fantasy'], 5),
  result(16, 'Comedy F', ['Comedy'], 4),
  result(17, 'Drama G', ['Drama'], 3),
];
const fixtureShows = searchFixture.map((entry) => entry.show);
const ALL_PRESENT = ['Comedy', 'Crime', 'Drama', 'Fantasy', 'Romance'];

describe('GET /api/search', () => {
  let mockedFetch: Mock;

  beforeEach(() => {
    for (const key of Object.keys(cache)) delete cache[key];
    mockedFetch = vi.fn().mockResolvedValue(jsonResponse(searchFixture));
    vi.stubGlobal('fetch', mockedFetch);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const get = (path: string) => request(createApp()).get(path);

  it('returns at most 3 shows for page 1 and a different slice on page 2', async () => {
    const first = await get('/api/search?q=shows');

    expect(first.status).toBe(200);
    expect(first.body).toEqual({
      shows: fixtureShows.slice(0, 3),
      page: 1,
      pageCount: 3,
      totalCount: 7,
      genres: ALL_PRESENT,
    });

    const second = await get('/api/search?q=shows&page=2');

    expect(second.body.page).toBe(2);
    expect(second.body.shows).toEqual(fixtureShows.slice(3, 6));
  });

  it('filters by genre and counts only the matching shows', async () => {
    const response = await get('/api/search?q=shows&genre=Drama');

    expect(response.status).toBe(200);
    expect(response.body.shows).toEqual([
      fixtureShows[0],
      fixtureShows[2],
      fixtureShows[4],
    ]);
    expect(response.body.totalCount).toBe(4);
    expect(response.body.pageCount).toBe(2);
    expect(response.body.genres).toEqual(ALL_PRESENT);
  });

  it('clamps out-of-range pages to the first and last page', async () => {
    const low = await get('/api/search?q=shows&page=0');
    expect(low.body.page).toBe(1);
    expect(low.body.shows).toEqual(fixtureShows.slice(0, 3));

    const high = await get('/api/search?q=shows&page=999');
    expect(high.body.page).toBe(3);
    expect(high.body.shows).toEqual(fixtureShows.slice(6));
  });

  it('serves genre/page variations of one query from one fetch', async () => {
    await get('/api/search?q=shows');
    await get('/api/search?q=shows&genre=Drama&page=2');
    await get('/api/search?q=shows&page=3');

    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('returns 400 with an error JSON when q is missing', async () => {
    const response = await get('/api/search');

    expect(response.status).toBe(400);
    expect(typeof response.body.error).toBe('string');
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('returns 502 with an error JSON when the upstream fails', async () => {
    mockedFetch.mockRejectedValue(new TypeError('fetch failed'));

    const response = await get('/api/search?q=shows');

    expect(response.status).toBe(502);
    expect(response.body.error).toContain('TVmaze request failed');
  });
});
