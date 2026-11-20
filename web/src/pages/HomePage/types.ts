import type { SearchPage } from '~/types';

import type { SearchStatus } from './constants';

/**
 * The genre/page selection the UI holds. It is mirrored by the last
 * `SearchRequest`, so a selection always describes the data on screen.
 */
export type Selection = {
  genre: string;
  page: number;
};

/**
 * The HomePage state the URL carries: the applied query, the genre filter
 * (with "All genres" as the default) and the results page. Defaults are
 * omitted from the serialized URL.
 */
export type UrlSearchState = {
  search: string;
  genre: string;
  page: number;
};

/**
 * One `/api/search` request: the query plus the genre/page selection already
 * mapped onto the request parameters (an undefined genre means "All genres").
 */
export type SearchRequest = {
  query: string;
  genre: string | undefined;
  page: number;
};

/**
 * A partial presentation update — the search field and the Task coordination
 * report status separately; the result data itself lives in the shows Entity
 * and reaches the View through the Presenter's selectors. A failed run also
 * carries the message the request layer reported.
 */
export type SearchChange = {
  status?: SearchStatus;
  queryEcho?: string;
  errorMessage?: string;
};

/**
 * The outcome of a shows-fetch Task run, returned to the caller. `'aborted'`
 * means the request was superseded or cancelled and stored nothing;
 * `'error'` carries the message the request layer reported.
 */
export type ShowsFetchResult =
  | { status: 'success'; page: SearchPage }
  | { status: 'error'; message: string }
  | { status: 'aborted' };

/**
 * The search-field actions the page presenter can trigger from the results.
 */
export type SearchControls = {
  clearSearch: () => void;
};
