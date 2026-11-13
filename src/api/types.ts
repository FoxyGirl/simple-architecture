/**
 * Shapes returned by the TVmaze API.
 *
 * They mirror the live `search/shows` response, so every field the app does
 * not use yet is optional rather than invented.
 */

export type ShowStatus =
  'Running' | 'Ended' | 'In Development' | 'To Be Determined' | 'Scheduled';

export interface ShowImage {
  medium: string;
  original: string;
}

export interface ShowRating {
  average: number | null;
}

export interface ShowNetwork {
  id: number;
  name: string;
  country: { name: string; code: string } | null;
  officialSite: string | null;
}

export interface ShowSchedule {
  time: string;
  days: string[];
}

export interface ShowExternals {
  tvrage?: number | null;
  thetvdb?: number | null;
  imdb?: string | null;
}

export interface Show {
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
}

export interface ShowSearchResult {
  score: number;
  show: Show;
}

export interface SearchShowsOptions {
  signal?: AbortSignal;
}
