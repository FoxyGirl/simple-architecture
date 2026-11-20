import type { Show } from '@server/types';
import { clampPage, getPageCount, getPageShows } from '@server/pagination';

// The genre helpers stay search-private; the shared pagination primitives
// (RESULTS_PER_PAGE, getPageCount, clampPage, getPageShows) moved to the
// ~/pagination module when the favorites route joined as a consumer.
export const ALL_GENRES = 'All genres';

/** The `GET /api/search` response envelope. */
export type SearchPage = {
  shows: Show[];
  page: number;
  pageCount: number;
  totalCount: number;
  genres: string[];
};

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
