import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchShows } from './shows';

const fetchResponse = (
  body: unknown,
  { ok = true, status = 200 } = {},
): { ok: boolean; status: number; json: () => Promise<unknown> } => ({
  ok,
  status,
  json: async () => body,
});

describe('api searchShows', () => {
  let mockedFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests /api/shows with the url-encoded query', async () => {
    mockedFetch.mockResolvedValue(fetchResponse([]));

    await searchShows('the office');

    expect(mockedFetch.mock.calls[0]?.[0]).toBe('/api/shows?q=the%20office');
  });

  it('returns the shows from the backend response', async () => {
    const shows = [
      { id: 1, name: 'The Office (US)' },
      { id: 2, name: 'Office Romance' },
    ];
    mockedFetch.mockResolvedValue(fetchResponse(shows));

    await expect(searchShows('office')).resolves.toEqual(shows);
  });

  it('throws on a non-OK backend response', async () => {
    mockedFetch.mockResolvedValue(
      fetchResponse(
        { error: 'TVmaze request failed' },
        { ok: false, status: 502 },
      ),
    );

    await expect(searchShows('office')).rejects.toThrow(
      'TVmaze search failed with status 502',
    );
  });

  it('propagates the AbortSignal to fetch', async () => {
    const controller = new AbortController();
    mockedFetch.mockResolvedValue(fetchResponse([]));

    await searchShows('office', { signal: controller.signal });

    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({
      signal: controller.signal,
    });
  });
});
