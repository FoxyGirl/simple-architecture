import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectFavoritesCount } from '~/store';

import type { FavoritesLocationState } from '../../types';

import { syncFavoritesSummary } from './tasks/syncFavoritesSummary';

/**
 * The favorites aspect of the home page presenter: the backend owns the
 * favorites, so the mount syncs the `{ count, ids }` summary through the
 * read Task. The hearts of the result cards read the mirrored ids and run
 * the toggle through the ShowList presenter, so only the count button is
 * left here — it reads the backend-computed count from the same summary and
 * its navigation stays at Presenter level.
 */
export const useShowFavorites = () => {
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

  return { count, goToFavorites };
};
