import type { Show } from '@api/types';

/**
 * The favorites Entity state: the full shows the user marked as favorite.
 * The whole `Show` is stored so the Favorites page can render a card
 * without re-fetching from the API.
 */
export type FavoritesState = {
  shows: Show[];
};
