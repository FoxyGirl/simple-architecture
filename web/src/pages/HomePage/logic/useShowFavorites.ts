import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectFavoriteIds, selectFavoritesCount } from '~/store';

import type { FavoritesLocationState } from '../../types';

import { useFavoriteToggle } from '~/pages/hooks/useFavoriteToggle';
import { syncFavoritesSummary } from './tasks/syncFavoritesSummary';

/**
 * The favorites aspect of the home page presenter: the backend owns the
 * favorites, so the mount syncs the `{ count, ids }` summary through the
 * read Task and the hearts read the mirrored ids from the Entity. The
 * count button reads the backend-computed count from the same summary and
 * its navigation stays here, at Presenter level. The toggle is the shared
 * Task's business rule; its user feedback (the distinct add/remove toasts
 * and the failure message) is composed by the shared toggle aspect at
 * Presenter level.
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
  const toggleFavorite = useFavoriteToggle(isFavorite);

  return { isFavorite, toggleFavorite, count, goToFavorites };
};
