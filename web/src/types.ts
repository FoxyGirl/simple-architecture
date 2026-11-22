/**
 * Shapes shared across the app: the TVmaze show model, the backend response
 * envelopes and the primitives of the API request layer. Types owned by a
 * single page, component or Entity stay in that owner's `types.ts`.
 */

export type ShowStatus =
  'Running' | 'Ended' | 'In Development' | 'To Be Determined' | 'Scheduled';

export type ShowImage = {
  medium: string;
  original: string;
};

export type ShowRating = {
  average: number | null;
};

export type ShowNetwork = {
  id: number;
  name: string;
  country: { name: string; code: string } | null;
  officialSite: string | null;
};

export type ShowSchedule = {
  time: string;
  days: string[];
};

export type ShowExternals = {
  tvrage?: number | null;
  thetvdb?: number | null;
  imdb?: string | null;
};

export type Show = {
  id: number;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: ShowStatus;
  runtime: number | null;
  premiered: string | null;
  ended: string | null;
  officialSite: string | null;
  schedule: ShowSchedule | null;
  rating: ShowRating | null;
  network: ShowNetwork | null;
  webChannel: ShowNetwork | null;
  externals: ShowExternals;
  image: ShowImage | null;
  summary: string | null;
  updated: number;
};

/**
 * The backend `GET /api/search` envelope: the requested page slice plus the
 * metadata the UI renders — the total match count and the genres present in
 * the unfiltered result set.
 */
export type SearchPage = {
  shows: Show[];
  page: number;
  pageCount: number;
  totalCount: number;
  genres: string[];
};

/**
 * The backend favorites summary served by add, remove and count: the
 * favorite count plus the ids the heart states read.
 */
export type FavoritesSummary = {
  count: number;
  ids: number[];
};

/**
 * The backend `GET /api/favorites` list envelope: one favorites page plus
 * the metadata the pagination renders — the same shape as the search page
 * without the genre list.
 */
export type FavoritesListPage = {
  shows: Show[];
  page: number;
  pageCount: number;
  totalCount: number;
};

/** The shows and total count of the list envelope, stored verbatim. */
export type FavoritesListSnapshot = Pick<
  FavoritesListPage,
  'shows' | 'totalCount'
>;

/** The HTTP methods the request layer speaks. */
export type HttpMethod = 'GET' | 'POST' | 'DELETE';

/**
 * The options of `requestJson`: the HTTP method (default GET), a JSON body —
 * any defined value is serialized with the matching content type — and the
 * abort signal. The request layer also accepts a bare `AbortSignal` where a
 * caller only needs cancellation.
 */
export type RequestJsonOptions = {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * A single query-parameter pair used when building API URLs, e.g.
 * `['genre', 'Comedy']`. Values are percent-encoded by the request layer.
 */
export type QueryParam = [key: string, value: string | number];
