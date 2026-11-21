import type { Show } from '~/types';
import { notify } from '~/notification';

import { TOAST_MESSAGES } from '../constants';
import { toggleShowFavorite } from '../tasks/toggleShowFavorite';

type FavoriteToggled = (show: Show, wasFavorite: boolean) => void;

/**
 * The favorite-toggle aspect shared by the HomePage and Favorites page
 * presenters: the toggle itself is the shared Task's business rule, while the
 * user feedback stays at Presenter level — a failure surfaces the message the
 * request layer reported, a success confirms the change with the distinct
 * add/remove toast and lets the page react through `onToggled` (the Favorites
 * page flips its removed marking there). The hook returns the toggle handler,
 * which resolves with the card's previous favorite state on success and with
 * `null` when the operation failed.
 */
export const useFavoriteToggle = (
  isFavorite: (showId: number) => boolean,
  onToggled?: FavoriteToggled,
) => {
  const toggleFavorite = async (show: Show): Promise<boolean | null> => {
    const wasFavorite = isFavorite(show.id);
    const result = await toggleShowFavorite(show, wasFavorite);

    if (result.status !== 'success') {
      notify.error(result.message);
      return null;
    }

    onToggled?.(show, wasFavorite);

    if (wasFavorite) {
      notify.info(`"${show.name}" ${TOAST_MESSAGES.REMOVED}`);
    } else {
      notify.success(`"${show.name}" ${TOAST_MESSAGES.ADDED}`);
    }

    return wasFavorite;
  };

  return toggleFavorite;
};
