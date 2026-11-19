import type { Show } from '~/types';

// Shared pagination primitives for the routes that page through shows.
// Moved out of routes/search when routes/favorites became the second
// consumer — per the backend organization rule, helpers reused by several
// routes live in the nearest common ancestor's folder. The page size
// mirrors the frontend UI constant
// (web/src/pages/HomePage/ShowSearchResults/constants.ts).
export const RESULTS_PER_PAGE = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** A result set always has at least one page, even when it is empty. */
export const getPageCount = (totalCount: number): number =>
  Math.max(1, Math.ceil(totalCount / RESULTS_PER_PAGE));

export const clampPage = (page: number, pageCount: number): number =>
  clamp(page, 1, pageCount);

/** Slice the shows visible on the given (already clamped) page. */
export const getPageShows = (shows: Show[], page: number): Show[] =>
  shows.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);
