import type { SearchShowsOptions, Show, ShowSearchResult } from './types';

const SEARCH_URL = 'https://api.tvmaze.com/search/shows';

/**
 * Search TVmaze shows by title.
 */
export const searchShows = async (
  query: string,
  { signal }: SearchShowsOptions = {},
): Promise<Show[]> => {
  const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`TVmaze search failed with status ${response.status}`);
  }

  const results: ShowSearchResult[] = await response.json();

  return results.map((result) => result.show);
};
