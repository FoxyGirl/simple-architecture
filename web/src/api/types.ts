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
