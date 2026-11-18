import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { CACHE_TTL_MS, cache, getCachedShows } from '../cache';

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const show = (id: number) => ({ id, name: `Show ${id}`, genres: ['Comedy'] });
const results = (id: number) => [{ score: 1, show: show(id) }];
const cached = (query: string) => cache[query];

describe('TVmaze response cache', () => {
  let mockedFetch: Mock;

  beforeEach(() => {
    for (const key of Object.keys(cache)) delete cache[key];
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches and stores the entry on the first call (MISS)', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(results(1)));
    await expect(getCachedShows('office')).resolves.toEqual([show(1)]);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(cached('office')).toEqual({
      data: [show(1)],
      fetchedAt: Date.now(),
    });
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      expect.stringContaining('cache MISS: office'),
    );
  });

  it('serves an identical call within the TTL from the cache (HIT)', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(results(1)));
    await getCachedShows('office');

    mockedFetch.mockResolvedValue(jsonResponse(results(2)));
    vi.advanceTimersByTime(CACHE_TTL_MS - 1);
    await expect(getCachedShows('office')).resolves.toEqual([show(1)]);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      expect.stringMatching(/cache HIT: office$/),
    );
  });

  it('refetches and refreshes the entry after the TTL passed', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(results(1)));
    await getCachedShows('office');
    const firstAt = cached('office')?.fetchedAt ?? 0;

    mockedFetch.mockResolvedValue(jsonResponse(results(2)));
    vi.advanceTimersByTime(CACHE_TTL_MS);
    await expect(getCachedShows('office')).resolves.toEqual([show(2)]);

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(cached('office')?.fetchedAt).toBeGreaterThan(firstAt);

    // The refreshed entry serves the next call again (HIT).
    await getCachedShows('office');
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('caches different queries independently', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(results(1)));
    await getCachedShows('office');
    mockedFetch.mockResolvedValue(jsonResponse(results(2)));
    await getCachedShows('friends');

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(cached('office')?.data).toEqual([show(1)]);
    expect(cached('friends')?.data).toEqual([show(2)]);

    await getCachedShows('office');
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('neither creates nor refreshes an entry when the fetch fails', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(results(1)));
    await getCachedShows('office');
    const stored = cached('office');

    mockedFetch.mockRejectedValue(new TypeError('fetch failed'));
    vi.advanceTimersByTime(CACHE_TTL_MS);
    await expect(getCachedShows('office')).rejects.toThrow('fetch failed');
    expect(cached('office')).toBe(stored);
    expect(stored?.fetchedAt).toBeLessThan(Date.now());

    await expect(getCachedShows('friends')).rejects.toThrow('fetch failed');
    expect(cached('friends')).toBeUndefined();
  });
});
