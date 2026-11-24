import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { syncFavoritesSummary } from '~/pages/tasks/syncFavoritesSummary';
import { selectFavoritesCount, selectSessionEmail } from '~/store';

import type { FavoritesLocationState } from '../../types';
import type { FavoritesButton } from '../types';

/**
 * The favorites aspect of the home page presenter: the backend owns the
 * favorites, so a signed-in mount syncs the `{ count, ids }` summary through
 * the read Task. The email is the effect dependency, so signing in or
 * switching user re-syncs and signing out stops at once. The hearts of the
 * result cards read the mirrored ids and run the toggle through the ShowList
 * presenter, so only the count button is left here: its prepared payload is
 * `null` while signed out, when the HomePage shows the guest sign-in prompt.
 */
export const useShowFavorites = () => {
  const email = useSelector(selectSessionEmail);
  const count = useSelector(selectFavoritesCount);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!email) return;

    void syncFavoritesSummary();
  }, [email]);

  const goToFavorites = () => {
    const state: FavoritesLocationState = { fromHome: `${pathname}${search}` };

    navigate('/favorites', { state });
  };

  const favoritesButton: FavoritesButton | null =
    email === null ? null : { count, onClick: goToFavorites };

  return { favoritesButton };
};
