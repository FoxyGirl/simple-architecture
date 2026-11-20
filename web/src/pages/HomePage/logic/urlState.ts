import type { SearchRequest, Selection, UrlSearchState } from '../types';
import { ALL_GENRES } from '../ShowSearchResults/constants';
import { parsePageParam } from '../../utils';

const PARAM_KEYS = ['search', 'genre', 'page'] as const;

/** Does the URL carry any synchronized HomePage parameter? */
export const hasSearchParams = (params: URLSearchParams): boolean =>
  PARAM_KEYS.some((key) => params.has(key));

/**
 * The HomePage state a URL describes. A missing or empty `search` is idle, a
 * missing or empty `genre` is "All genres", and an invalid `page` is page 1.
 */
export const parseSearchState = (params: URLSearchParams): UrlSearchState => ({
  search: params.get('search')?.trim() ?? '',
  genre: params.get('genre') || ALL_GENRES,
  page: parsePageParam(params.get('page')),
});

/**
 * The URL representation of a HomePage state: parameters equal to their
 * default are omitted, so an idle page is a bare `/` and the first page
 * carries no `page` parameter.
 */
export const serializeSearchState = (
  state: UrlSearchState,
): URLSearchParams => {
  const params = new URLSearchParams();
  const search = state.search.trim();

  if (search) params.set('search', search);
  if (state.genre !== ALL_GENRES) params.set('genre', state.genre);
  if (state.page > 1) params.set('page', String(state.page));

  return params;
};

/** Map a URL state onto the selection the request helper expects. */
export const toSelection = (state: UrlSearchState): Selection => ({
  genre: state.genre,
  page: state.page,
});

/**
 * The genre/page selection mapped onto the request parameters the API
 * speaks: an undefined genre means "All genres".
 */
export const toRequest = (
  query: string,
  selection: Selection,
): SearchRequest => ({
  query,
  genre: selection.genre === ALL_GENRES ? undefined : selection.genre,
  page: selection.page,
});

/** Is the stored request the one this URL state describes? */
export const isSameRequest = (
  current: SearchRequest | null,
  next: SearchRequest,
): boolean =>
  current !== null &&
  current.query === next.query &&
  current.genre === next.genre &&
  current.page === next.page;
