import type { SearchPage, SearchShowsOptions } from './types';

type SearchSelection = {
  genre?: string;
  page?: number;
};

const buildUrl = (query: string, { genre, page }: SearchSelection) => {
  const params = [`q=${encodeURIComponent(query)}`];

  if (genre) params.push(`genre=${encodeURIComponent(genre)}`);
  if (page) params.push(`page=${page}`);

  return `/api/search?${params.join('&')}`;
};

/**
 * Search shows through the backend, which owns the TVmaze interaction, the
 * genre filtering and the pagination. Omit `genre` for the "All genres"
 * option: the backend then returns the unfiltered result set.
 */
export const searchShowsPage = async (
  query: string,
  selection: SearchSelection,
  { signal }: SearchShowsOptions = {},
): Promise<SearchPage> => {
  const response = await fetch(buildUrl(query, selection), { signal });

  if (!response.ok) {
    throw new Error(`TVmaze search failed with status ${response.status}`);
  }

  const page: SearchPage = await response.json();

  return page;
};
