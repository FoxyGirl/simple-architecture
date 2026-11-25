import { clampPage, getPageCount, getPageShows } from '@server/pagination';
import type { Show } from '@server/types';

import type { FavoritesListPage, FavoritesSummary } from './types';

// The in-memory favorites storage required by the PRD: a plain object keyed
// by the normalized email, each value a plain object keyed by the TVmaze
// show id holding the full snapshot from the moment it was favorited. It
// lives in the server process memory — lost on restart, not shared between
// instances. Exported so the app-level suites can reset it between cases
// (the same seam as `cache`); the routes only touch it through the helpers
// below and never call TVmaze for favorites.
//
// Recorded decision: JavaScript iterates integer-like object keys in
// ascending numeric order, so each email's entries are read back in that
// stable order — the helpers preserve the storage's own iteration order
// rather than sorting, and re-adding a known id keeps the entry's position.
export const favoritesByEmail: Record<string, Record<number, Show>> = {};

/** Store the full snapshot of the favorited show in that email's list. */
export const addFavorite = (email: string, show: Show): void => {
  const list = (favoritesByEmail[email] ??= {});

  list[show.id] = show;
};

/** Drop a favorite from one email; an unknown id or email is a no-op. */
export const removeFavorite = (email: string, id: number): void => {
  const list = favoritesByEmail[email];

  if (list) delete list[id];
};

/** The email's current favorite count and ids, in storage order. */
export const getFavoritesSummary = (email: string): FavoritesSummary => {
  const ids = Object.keys(favoritesByEmail[email] ?? {}).map(Number);

  return { count: ids.length, ids };
};

/**
 * The email's favorites list page: the RESULTS_PER_PAGE slice of that list
 * with the requested page clamped into [1, pageCount] — an unknown email or
 * empty list yields one empty page, exactly like the search route.
 */
export const getFavoritesListPage = (
  email: string,
  requestedPage: number,
): FavoritesListPage => {
  const shows = Object.values(favoritesByEmail[email] ?? {});
  const pageCount = getPageCount(shows.length);
  const page = clampPage(requestedPage, pageCount);

  return {
    shows: getPageShows(shows, page),
    page,
    pageCount,
    totalCount: shows.length,
  };
};
