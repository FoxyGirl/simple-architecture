import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { Show } from '@api/types';
import { selectFavoritesList } from '@store';

import { fetchFavoritesPage } from '../../tasks/fetchFavoritesPage';
import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The Favorites page Presenter: the backend list is the page's data
 * source, so it fetches the first page on mount and every later page
 * through the read Task. A listed show is always a favorite, so the heart
 * removes it through the shared toggle Task and the current page is
 * refetched afterwards — the backend clamps the envelope when the last
 * page shrinks away. Navigation back to the catalogue stays here, at
 * Presenter level.
 */
export const useFavoritesPage = () => {
  const list = useSelector(selectFavoritesList);
  const navigate = useNavigate();

  useEffect(() => {
    void fetchFavoritesPage(1);
  }, []);

  const selectPage = useCallback((page: number) => {
    void fetchFavoritesPage(page);
  }, []);

  const removeFromFavorites = useCallback(
    (show: Show) => {
      void (async () => {
        const result = await toggleShowFavorite(show, true);

        if (result.status === 'success') {
          await fetchFavoritesPage(list?.page ?? 1);
        }
      })();
    },
    [list?.page],
  );

  const goToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return { list, removeFromFavorites, selectPage, goToHome };
};
