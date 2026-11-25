import type { Show } from '~/types';
import { notify } from '~/notification';

import { TOAST_MESSAGES } from '../constants';
import { toggleShowFavorite } from '../tasks/toggleShowFavorite';

type FavoriteToggleCallback = (show: Show, wasFavorite: boolean) => void;

/**
 * The favorite-toggle aspect shared by the HomePage and Favorites page
 * presenters: the toggle itself is the shared Task's business rule, while the
 * user feedback stays at Presenter level — a failure surfaces the message the
 * request layer reported, a success confirms the change with the distinct
 * add/remove toast. The page reacts optimistically: `onToggled` fires at click
 * time with the pre-click favorite state (which also fixes the Task's
 * direction), and a failed operation reports through `onToggleFailed` so the
 * page can roll its optimistic view state back. The hook returns the toggle
 * handler, which resolves with the card's previous favorite state on success
 * and with `null` when the operation failed.
 */
export const useFavoriteToggle = (
  isFavorite: (showId: number) => boolean,
  onToggled?: FavoriteToggleCallback,
  onToggleFailed?: FavoriteToggleCallback,
) => {
  const toggleFavorite = async (show: Show): Promise<boolean | null> => {
    const wasFavorite = isFavorite(show.id);

    onToggled?.(show, wasFavorite);

    const result = await toggleShowFavorite(show, wasFavorite);

    if (result.status !== 'success') {
      onToggleFailed?.(show, wasFavorite);
      notify.error(result.message);
      return null;
    }

    if (wasFavorite) {
      notify.info(`"${show.name}" ${TOAST_MESSAGES.REMOVED}`);
    } else {
      notify.success(`"${show.name}" ${TOAST_MESSAGES.ADDED}`);
    }

    return wasFavorite;
  };

  return toggleFavorite;
};
