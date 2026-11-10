import { RESULTS_PER_PAGE } from '../constants.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * A result set always has at least one page, even when it is empty.
 */
export const getPageCount = (totalCount) =>
  Math.max(1, Math.ceil(totalCount / RESULTS_PER_PAGE));

export const clampPage = (page, pageCount) => clamp(page, 1, pageCount);

/**
 * Slice the shows visible on the given page.
 */
export const getPageShows = (shows, page) =>
  shows.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);
