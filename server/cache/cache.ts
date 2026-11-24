import type { Show } from '@server/types';
import { searchShows } from '@server/tvmaze';

/**
 * Caches `searchShows` results for 5 minutes. Failed requests are not cached.
 */
export const cache: Record<string, { data: Show[]; fetchedAt: number }> = {};

export const CACHE_TTL_MS = 5 * 60 * 1000;

// Reuse an in-flight request for the same query.
const pendingRequests = new Map<string, Promise<Show[]>>();

const logCache = (
  outcome: 'HIT' | 'MISS' | 'WAIT',
  query: string,
  now: number,
) => {
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
  const normalizedQuery = query.trim().toLowerCase();
  const now = Date.now();
  const entry = cache[normalizedQuery];

  if (entry && now - entry.fetchedAt < CACHE_TTL_MS) {
    logCache('HIT', normalizedQuery, now);
    return entry.data;
  }

  const pendingRequest = pendingRequests.get(normalizedQuery);

  if (pendingRequest) {
    logCache('WAIT', normalizedQuery, now);
    return pendingRequest;
  }

  logCache('MISS', normalizedQuery, now);

  const request = searchShows(query)
    .then((data) => {
      cache[normalizedQuery] = { data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      pendingRequests.delete(normalizedQuery);
    });

  pendingRequests.set(normalizedQuery, request);

  return request;
};
