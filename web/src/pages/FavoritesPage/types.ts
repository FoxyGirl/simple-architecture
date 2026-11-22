import type { FavoritesListPage, Show } from '~/types';

/**
 * The soft-removal view state: the removed show ids plus the shows array
 * they were marked against, so any fresh fetch invalidates the marking
 * without the Presenter tracking pages by hand.
 */
export type RemovedMarking = {
  shows: Show[];
  ids: number[];
};

/**
 * The outcome of the fetchFavoritesPage Task; `'success'` carries the
 * page envelope whose shows were dispatched into the Entity, `'error'` the
 * message the request layer reported.
 */
export type FavoritesListResult =
  | { status: 'success'; list: FavoritesListPage }
  | { status: 'error'; message: string };
