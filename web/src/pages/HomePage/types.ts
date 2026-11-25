import type { SearchPage } from '~/types';

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
 * Which part of the results a loading state replaces. `'full'` covers a load
 * that invalidates the whole block (the query changed), `'cards'` a selection
 * load (genre/page) that only replaces the show cards.
 */
export type LoadingScope = 'full' | 'cards';

/**
 * The prepared favorites-count button: the backend-synced count and the
 * navigation action. It is `null` while signed out, when the guest sign-in
 * prompt renders in its place.
 */
export type FavoritesButton = {
  count: number;
  onClick: () => void;
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
