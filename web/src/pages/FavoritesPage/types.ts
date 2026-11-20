import type { FavoritesListPage } from '~/types';

/**
 * The soft-removal view state: the removed show ids plus the list envelope
 * they were marked against, so any fresh fetch invalidates the marking
 * without the Presenter tracking pages by hand.
 */
export type RemovedMarking = {
  list: FavoritesListPage | null;
  ids: number[];
};

/**
 * The outcome of the fetchFavoritesPage Task; `'success'` carries the
 * page envelope that was dispatched into the Entity, `'error'` the message
 * the request layer reported.
 */
export type FavoritesListResult =
  | { status: 'success'; list: FavoritesListPage }
  | { status: 'error'; message: string };
