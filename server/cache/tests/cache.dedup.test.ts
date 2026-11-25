import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { cache, getCachedShows } from '../cache';

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const show = (id: number) => ({ id, name: `Show ${id}`, genres: ['Comedy'] });
const results = (id: number) => [{ score: 1, show: show(id) }];
const cached = (query: string) => cache[query];

describe('TVmaze request deduplication', () => {
  let mockedFetch: Mock;

  beforeEach(() => {
    for (const key of Object.keys(cache)) delete cache[key];
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reuses the in-flight request for the same query (WAIT)', async () => {
    let settle: (response: Response) => void = () => undefined;
    mockedFetch.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          settle = resolve;
        }),
    );

    const first = getCachedShows('office');
    const second = getCachedShows('office');

    expect(mockedFetch).toHaveBeenCalledTimes(1);

    settle(jsonResponse(results(1)));
    await expect(first).resolves.toEqual([show(1)]);
    await expect(second).resolves.toEqual([show(1)]);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      expect.stringContaining('cache WAIT: office'),
    );
  });

  it('treats queries differing only in case or whitespace as one key', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(results(1)));
    await getCachedShows('  Office  ');

    expect(cached('office')).toBeDefined();
    expect(cached('  Office  ')).toBeUndefined();

    mockedFetch.mockResolvedValue(jsonResponse(results(2)));
    await expect(getCachedShows('office')).resolves.toEqual([show(1)]);
    await expect(getCachedShows('OFFICE')).resolves.toEqual([show(1)]);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });
});
