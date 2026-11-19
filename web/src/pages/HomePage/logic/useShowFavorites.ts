import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { Show } from '@api/types';
import { notify } from '@notification';
import { selectFavoriteIds } from '@store';

import { TOAST_MESSAGES } from '../../constants';
import { syncFavoritesSummary } from '../../tasks/syncFavoritesSummary';
import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The favorites aspect of the home page presenter: the backend owns the
 * favorites, so the mount syncs the `{ count, ids }` summary through the
 * read Task and the hearts read the mirrored ids from the Entity. The
 * toggle itself is the shared Task's business rule; its success result is
 * confirmed through the global notify API — distinct add/remove messages,
 * while a failed operation stays silent.
 */
export const useShowFavorites = () => {
  const favoriteIds = useSelector(selectFavoriteIds);

  useEffect(() => {
    void syncFavoritesSummary();
  }, []);

  const isFavorite = useCallback(
    (showId: number) => favoriteIds.includes(showId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    (show: Show) => {
      const wasFavorite = favoriteIds.includes(show.id);

      void (async () => {
        const result = await toggleShowFavorite(show, wasFavorite);

        if (result.status === 'success') {
          if (wasFavorite) {
            notify.info(`"${show.name}" ${TOAST_MESSAGES.REMOVED}`);
          } else {
            notify.success(`"${show.name}" ${TOAST_MESSAGES.ADDED}`);
          }
        }
      })();
    },
    [favoriteIds],
  );

  return { isFavorite, toggleFavorite };
};
