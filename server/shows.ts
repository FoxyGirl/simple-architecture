import type { Show } from './types';

// Mirrors of the frontend UI constants
// (web/src/pages/HomePage/ShowSearchResults/constants.ts).
export const RESULTS_PER_PAGE = 3;
export const ALL_GENRES = 'All genres';

/** The `GET /api/search` response envelope. */
export type SearchPage = {
  shows: Show[];
  page: number;
  pageCount: number;
  totalCount: number;
  genres: string[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * The sorted, deduplicated list of genres present in a result set. The UI
 * prepends its own "All genres" chip, so this list stays purely presentational.
 */
export const collectGenres = (shows: Show[]): string[] => {
  const present = new Set<string>();

  for (const show of shows) {
    for (const genre of show.genres) present.add(genre);
  }

  return [...present].sort();
};

/**
 * Keep only the shows carrying the given genre; an absent genre or the
 * "All genres" option returns the result set unfiltered.
 */
export const filterShowsByGenre = (shows: Show[], genre?: string): Show[] => {
  if (!genre || genre === ALL_GENRES) return shows;

  return shows.filter((show) => show.genres.includes(genre));
};

/** A result set always has at least one page, even when it is empty. */
export const getPageCount = (totalCount: number): number =>
  Math.max(1, Math.ceil(totalCount / RESULTS_PER_PAGE));

export const clampPage = (page: number, pageCount: number): number =>
  clamp(page, 1, pageCount);

/** Slice the shows visible on the given (already clamped) page. */
export const getPageShows = (shows: Show[], page: number): Show[] =>
  shows.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);

/**
 * Build the `GET /api/search` envelope from the full (unpaginated, cached)
 * result set: `genres` describes the unfiltered set so the UI can render its
 * chips, while the page metadata describes the genre-filtered match list.
 */
export const buildSearchPage = (
  shows: Show[],
  genre: string | undefined,
  requestedPage: number,
): SearchPage => {
  const filtered = filterShowsByGenre(shows, genre);
  const pageCount = getPageCount(filtered.length);
  const page = clampPage(requestedPage, pageCount);

  return {
    shows: getPageShows(filtered, page),
    page,
    pageCount,
    totalCount: filtered.length,
    genres: collectGenres(shows),
  };
};
