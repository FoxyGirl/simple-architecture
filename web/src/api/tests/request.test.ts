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
});
