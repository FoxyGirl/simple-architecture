import type { Show } from '@api/types';
import { addFavorite, removeFavorite, store } from '@store';

/**
 * The favorite-toggle Task, shared by the home-page cards and the
 * Favorites page. The current favorite state arrives through the explicit
 * `isFavorite` argument — the Task never reads the store, it only mutates
 * it through `store.dispatch`.
 */
export const toggleShowFavorite = (show: Show, isFavorite: boolean): void => {
  store.dispatch(isFavorite ? removeFavorite(show.id) : addFavorite(show));
};
