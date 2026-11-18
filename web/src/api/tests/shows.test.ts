import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../errors';
import { searchShowsPage } from '../shows';

const fetchResponse = (
  body: unknown,
  { ok = true, status = 200 } = {},
): { ok: boolean; status: number; json: () => Promise<unknown> } => ({
  ok,
  status,
  json: async () => body,
});

const envelope = {
  shows: [],
  page: 1,
  pageCount: 1,
  totalCount: 0,
  genres: [],
};

describe('api searchShowsPage', () => {
  let mockedFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('requests /api/search with the encoded query and page, no genre', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await searchShowsPage('the office', { page: 1 });

    expect(mockedFetch.mock.calls[0]?.[0]).toBe(
      '/api/search?q=the%20office&page=1',
    );
  });

  it('includes the url-encoded genre when one is set', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await searchShowsPage('shows', { genre: 'Kids & Family', page: 2 });

    expect(mockedFetch.mock.calls[0]?.[0]).toBe(
      '/api/search?q=shows&genre=Kids%20%26%20Family&page=2',
    );
  });

  it('returns the envelope from the backend response', async () => {
    const body = { ...envelope, totalCount: 6, genres: ['Comedy', 'Drama'] };
    mockedFetch.mockResolvedValue(fetchResponse(body));

    await expect(searchShowsPage('office', { page: 1 })).resolves.toEqual(body);
  });

  it('throws on a non-OK backend response', async () => {
    mockedFetch.mockResolvedValue(
      fetchResponse(
        { error: 'TVmaze request failed' },
        { ok: false, status: 502 },
      ),
    );

    await expect(searchShowsPage('office', { page: 1 })).rejects.toThrow(
      'API request failed with status 502',
    );
  });

  it('normalizes the non-OK failure into an ApiError carrying the status', async () => {
    mockedFetch.mockResolvedValue(
      fetchResponse(
        { error: 'TVmaze request failed' },
        { ok: false, status: 502 },
      ),
    );

    await expect(searchShowsPage('office', { page: 1 })).rejects.toThrow(
      ApiError,
    );
  });

  it('requests <base>/api/search when a base URL is configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.test');
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await searchShowsPage('office', { genre: 'Comedy', page: 1 });

    expect(mockedFetch.mock.calls[0]?.[0]).toBe(
      'https://backend.example.test/api/search?q=office&genre=Comedy&page=1',
    );
  });

  it('propagates the AbortSignal to fetch', async () => {
    const controller = new AbortController();
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await searchShowsPage('office', { page: 1 }, { signal: controller.signal });

    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({
      signal: controller.signal,
    });
  });
});
