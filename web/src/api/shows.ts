import { buildApiUrl, requestJson } from './request';

import type { QueryParam, SearchPage, SearchShowsOptions } from './types';

type SearchSelection = {
  genre?: string;
  page?: number;
};

/**
 * Search shows through the backend, which owns the TVmaze interaction, the
 * genre filtering and the pagination. Omit `genre` for the "All genres"
 * option: the backend then returns the unfiltered result set. URL building,
 * response parsing and error normalization live in the API request layer.
 */
export const searchShowsPage = async (
  query: string,
  { genre, page }: SearchSelection,
  { signal }: SearchShowsOptions = {},
): Promise<SearchPage> => {
  const params: QueryParam[] = [['q', query]];

  if (genre) params.push(['genre', genre]);
  if (page) params.push(['page', page]);

  return requestJson<SearchPage>(buildApiUrl('/api/search', params), signal);
};
