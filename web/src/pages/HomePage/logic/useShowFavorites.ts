import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { Show } from '@api/types';
import { selectFavoriteIds } from '@store';

import { syncFavoritesSummary } from '../../tasks/syncFavoritesSummary';
import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The favorites aspect of the home page presenter: the backend owns the
 * favorites, so the mount syncs the `{ count, ids }` summary through the
 * read Task and the hearts read the mirrored ids from the Entity. The
 * toggle itself is the shared Task's business rule.
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
      void toggleShowFavorite(show, favoriteIds.includes(show.id));
    },
    [favoriteIds],
  );

  return { isFavorite, toggleFavorite };
};
