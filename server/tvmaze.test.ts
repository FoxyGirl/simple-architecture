import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { searchShows } from './tvmaze';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const show = (id: number, name: string) => ({ id, name, genres: ['Comedy'] });

describe('tvmaze searchShows', () => {
  let mockedFetch: Mock;

  beforeEach(() => {
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('maps { score, show } results to show objects', async () => {
    mockedFetch.mockResolvedValue(
      jsonResponse([
        { score: 1, show: show(1, 'The Office (US)') },
        { score: 0.6, show: show(2, 'The Office (UK)') },
      ]),
    );

    await expect(searchShows('office')).resolves.toEqual([
      show(1, 'The Office (US)'),
      show(2, 'The Office (UK)'),
    ]);
  });

  it('url-encodes the query on the search/shows endpoint', async () => {
    mockedFetch.mockResolvedValue(jsonResponse([]));

    await searchShows('the office');

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://api.tvmaze.com/search/shows?q=the%20office',
    );
  });

  it('uses TVMAZE_BASE_URL as the API base when set', async () => {
    vi.stubEnv('TVMAZE_BASE_URL', 'http://localhost:3002');
    mockedFetch.mockResolvedValue(jsonResponse([]));

    await searchShows('office');

    expect(mockedFetch).toHaveBeenCalledWith(
      'http://localhost:3002/search/shows?q=office',
    );
  });

  it('defaults to the real TVmaze API when TVMAZE_BASE_URL is unset', async () => {
    vi.stubEnv('TVMAZE_BASE_URL', undefined);
    mockedFetch.mockResolvedValue(jsonResponse([]));

    await searchShows('office');

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://api.tvmaze.com/search/shows?q=office',
    );
  });

  it('throws when TVmaze responds with a non-OK status', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({ error: 'boom' }, 500));

    await expect(searchShows('office')).rejects.toThrow(
      'TVmaze search failed with status 500',
    );
  });

  it('throws when the network request fails', async () => {
    mockedFetch.mockRejectedValue(new TypeError('fetch failed'));

    await expect(searchShows('office')).rejects.toThrow('fetch failed');
  });

  it('logs one timestamped request line per call', async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse([]));
    await searchShows('a');

    mockedFetch.mockRejectedValueOnce(new Error('down'));
    await expect(searchShows('b')).rejects.toThrow('down');

    const logged = vi.mocked(console.log);
    expect(logged).toHaveBeenCalledTimes(2);
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining(
        'TVmaze request: https://api.tvmaze.com/search/shows?q=a',
      ),
    );
    const [firstLine] = logged.mock.calls[0] ?? [];
    expect(firstLine).toMatch(/^\[\d{4}-\d{2}-\d{2}T[\d:.]+Z\] /);
  });
});
