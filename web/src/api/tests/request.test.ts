import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../errors';
import { requestJson } from '../request';

const envelope = {
  shows: [],
  page: 1,
  pageCount: 1,
  totalCount: 0,
  genres: [],
};

const fetchResponse = (
  body: unknown,
  { ok = true, status = 200 } = {},
): { ok: boolean; status: number; json: () => Promise<unknown> } => ({
  ok,
  status,
  json: async () => body,
});

describe('api requestJson', () => {
  let mockedFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses the JSON body of an OK response', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await expect(requestJson('/api/search')).resolves.toEqual(envelope);
  });

  it('normalizes a non-OK response into an ApiError with the status', async () => {
    mockedFetch.mockResolvedValue(
      fetchResponse({ error: 'gone' }, { ok: false, status: 503 }),
    );

    const error: unknown = await requestJson('/api/search').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'ApiError', status: 503 });
  });

  it('propagates the AbortSignal to fetch', async () => {
    const controller = new AbortController();
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await requestJson('/api/search', controller.signal);

    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({
      signal: controller.signal,
    });
  });

  it('defaults to a GET without a body', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await requestJson('/api/favorites/count');

    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
    expect(mockedFetch.mock.calls[0]?.[1]).not.toHaveProperty('body');
  });

  it('sends the method, the JSON body and its content type for optioned calls', async () => {
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await requestJson('/api/favorites', {
      method: 'POST',
      body: { show: { id: 1 } },
    });

    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: '{"show":{"id":1}}',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('accepts the signal inside the options object as well', async () => {
    const controller = new AbortController();
    mockedFetch.mockResolvedValue(fetchResponse(envelope));

    await requestJson('/api/favorites', {
      method: 'DELETE',
      signal: controller.signal,
    });

    expect(mockedFetch.mock.calls[0]?.[1]).toMatchObject({
      method: 'DELETE',
      signal: controller.signal,
    });
  });
});
