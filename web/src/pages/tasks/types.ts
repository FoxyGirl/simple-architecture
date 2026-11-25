import type { FavoritesSummary } from '~/types';

/**
 * The outcome of the favorites-summary Tasks, returned to the caller.
 * `'success'` carries the summary that was dispatched into the Entity;
 * `'error'` carries the message the request layer reported.
 */
export type FavoritesSummaryResult =
  | { status: 'success'; summary: FavoritesSummary }
  | { status: 'error'; message: string };
