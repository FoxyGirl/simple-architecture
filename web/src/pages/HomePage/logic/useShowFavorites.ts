import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import type { Show } from '~/api/types';
import { notify } from '~/notification';
import { selectFavoriteIds, selectFavoritesCount } from '~/store';

import type { FavoritesLocationState } from '../../types';

import { TOAST_MESSAGES } from '../../constants';
import { syncFavoritesSummary } from '../../tasks/syncFavoritesSummary';
import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The favorites aspect of the home page presenter: the backend owns the
 * favorites, so the mount syncs the `{ count, ids }` summary through the
 * read Task and the hearts read the mirrored ids from the Entity. The
 * count button reads the backend-computed count from the same summary and
 * its navigation stays here, at Presenter level. The toggle itself is the
 * shared Task's business rule; its success result is confirmed through the
 * global notify API — distinct add/remove messages, while a failed
 * operation stays silent.
 */
export const useShowFavorites = () => {
  const favoriteIds = useSelector(selectFavoriteIds);
  const count = useSelector(selectFavoritesCount);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    void syncFavoritesSummary();
  }, []);

  const goToFavorites = () => {
    const state: FavoritesLocationState = { fromHome: `${pathname}${search}` };

    navigate('/favorites', { state });
  };

  const isFavorite = (showId: number) => favoriteIds.includes(showId);

  const toggleFavorite = (show: Show) => {
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
  };

  return { isFavorite, toggleFavorite, count, goToFavorites };
};
