import type { Show } from '../types';
import { searchShows } from '../tvmaze';

// The in-memory TVmaze response cache required by the PRD: a plain object
// keyed by the search query, each entry holding the mapped shows and the
// timestamp of the fetch that produced them. Because TVMAZE_BASE_URL is
// constant for a running process, the query uniquely identifies its TVmaze
// request. The cache lives in the server process memory — lost on restart,
// not shared between instances. Exported so the test suites can reset
// between cases; the application itself only reads and writes entries
// through getCachedShows.
export const cache: Record<string, { data: Show[]; fetchedAt: number }> = {};

// A cached response stays fresh for five minutes; older entries are refetched.
export const CACHE_TTL_MS = 5 * 60 * 1000;

const logCache = (outcome: 'HIT' | 'MISS', query: string, now: number) => {
  console.log(
    `[${new Date(now).toISOString()}] TVmaze cache ${outcome}: ${query}`,
  );
};

/**
 * `searchShows` fronted by the 5-minute cache: a fresh entry is returned
 * without touching TVmaze, a missing or outdated one is fetched and stored.
 * A failed request throws before anything is written, so it neither creates
 * nor refreshes an entry.
 */
export const getCachedShows = async (query: string): Promise<Show[]> => {
  const now = Date.now();
  const entry = cache[query];

  if (entry && now - entry.fetchedAt < CACHE_TTL_MS) {
    logCache('HIT', query, now);
    return entry.data;
  }

  logCache('MISS', query, now);
  const data = await searchShows(query);
  cache[query] = { data, fetchedAt: now };
  return data;
};
