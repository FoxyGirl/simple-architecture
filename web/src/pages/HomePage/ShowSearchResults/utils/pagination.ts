import type { Show } from '@api/types';

import { RESULTS_PER_PAGE } from '../constants';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * A result set always has at least one page, even when it is empty.
 */
export const getPageCount = (totalCount: number): number =>
  Math.max(1, Math.ceil(totalCount / RESULTS_PER_PAGE));

export const clampPage = (page: number, pageCount: number): number =>
  clamp(page, 1, pageCount);

/**
 * Slice the shows visible on the given page.
 */
export const getPageShows = (shows: Show[], page: number): Show[] =>
  shows.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);
