import type { Show } from '~/types';

/**
 * The favorites aspect is derived by the presenter from the Entity by
 * default; a consumer that owns its own favorite state (the Favorites page's
 * soft-removal marking) injects it through the optional props instead.
 */
export type ShowListProps = {
  shows: Show[];
  isFavorite?: (showId: number) => boolean;
  onToggleFavorite?: (show: Show) => void;
  isRemoved?: (showId: number) => boolean;
};
