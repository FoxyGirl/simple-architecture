import { clampPage, getPageCount, getPageShows } from '@server/pagination';
import type { Show } from '@server/types';

import type { FavoritesListPage, FavoritesSummary } from './types';

// The in-memory favorites storage required by the PRD: a plain object keyed
// by the TVmaze show id, each entry holding the full show snapshot from the
// moment it was favorited. It lives in the server process memory — lost on
// restart, not shared between instances. Exported so the app-level suites
// can reset it between cases (the same seam as `cache`); the routes only
// touch it through the helpers below and never call TVmaze for favorites.
//
// Recorded decision: JavaScript iterates integer-like object keys in
// ascending numeric order, so the entries are read back in that stable
// order — the helpers preserve the storage's own iteration order rather
// than sorting, and re-adding a known id keeps the entry's position.
export const favorite: Record<number, Show> = {};

/** Store the full snapshot of the favorited show under its id. */
export const addFavorite = (show: Show): void => {
  favorite[show.id] = show;
};

/** Drop a favorite; removing an unknown id deletes nothing (recorded). */
export const removeFavorite = (id: number): void => {
  delete favorite[id];
};

/** The current favorite count and ids, in storage order. */
export const getFavoritesSummary = (): FavoritesSummary => {
  const ids = Object.keys(favorite).map(Number);

  return { count: ids.length, ids };
};

/**
 * The favorites list page: the shared RESULTS_PER_PAGE slice of the stored
 * shows with the requested page clamped into [1, pageCount] — an empty
 * storage yields one empty page, exactly like the search route.
 */
export const getFavoritesListPage = (
  requestedPage: number,
): FavoritesListPage => {
  const shows = Object.values(favorite);
  const pageCount = getPageCount(shows.length);
  const page = clampPage(requestedPage, pageCount);

  return {
    shows: getPageShows(shows, page),
    page,
    pageCount,
    totalCount: shows.length,
  };
};
