import type { FavoritesListPage } from '@api/types';

/**
 * The soft-removal view state: the removed show ids plus the list envelope
 * they were marked against, so any fresh fetch invalidates the marking
 * without the Presenter tracking pages by hand.
 */
export type RemovedMarking = {
  list: FavoritesListPage | null;
  ids: number[];
};
