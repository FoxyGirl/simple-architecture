import type { SearchShowsOptions, Show } from './types';

const SEARCH_URL = '/api/shows';

/**
 * Search shows through the backend, which owns the TVmaze interaction.
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

  const shows: Show[] = await response.json();

  return shows;
};
