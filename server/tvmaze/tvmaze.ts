import type { Show, ShowSearchResult } from '@server/types';

const DEFAULT_BASE_URL = 'https://api.tvmaze.com';

// Read per call so tests can point the backend at a local stub through
// TVMAZE_BASE_URL without re-importing this module.
const baseUrl = () => process.env.TVMAZE_BASE_URL ?? DEFAULT_BASE_URL;

/**
 * Search TVmaze shows by title, mapping the `search/shows` results to shows.
 */
export const searchShows = async (query: string): Promise<Show[]> => {
  const url = `${baseUrl()}/search/shows?q=${encodeURIComponent(query)}`;

  console.log(`[${new Date().toISOString()}] TVmaze request: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TVmaze search failed with status ${response.status}`);
  }

  // Node's fetch typings give `json()` as `unknown`; the search/shows
  // response shape is fixed by TVmaze and consumed as-is downstream.
  const results = (await response.json()) as ShowSearchResult[];

  return results.map((result) => result.show);
};
