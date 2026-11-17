/**
 * Shapes returned by the TVmaze API.
 *
 * They mirror the live `search/shows` response and the frontend copy in
 * `web/src/api/types.ts` — the backend owns the TVmaze interaction, so it
 * declares its own types and the workspaces stay independent.
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

export type ShowSearchResult = {
  score: number;
  show: Show;
};
