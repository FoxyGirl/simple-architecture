/**
 * Shapes returned by the backend for TVmaze shows.
 *
 * They mirror the live TVmaze show payload, so every field the app does
 * not use yet is optional rather than invented.
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

export type SearchShowsOptions = {
  signal?: AbortSignal;
};

/** The HTTP methods the API layer speaks. */
export type HttpMethod = 'GET' | 'POST' | 'DELETE';

/**
 * The options of {@link requestJson}: the HTTP method (default GET), a
 * JSON body — any defined value is serialized with the matching content
 * type — and the abort signal. The request layer also accepts a bare
 * `AbortSignal` where a caller only needs cancellation.
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
