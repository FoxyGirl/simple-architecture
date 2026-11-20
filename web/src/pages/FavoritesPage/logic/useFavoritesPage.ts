import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { Show } from '@api/types';
import { notify } from '@notification';
import { selectFavoritesList } from '@store';

import { pluralize } from '../../utils';
import { TOAST_MESSAGES } from '../../constants';
import { fetchFavoritesPage } from '../../tasks/fetchFavoritesPage';
import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The Favorites page Presenter: the backend list is the page's data
 * source, so it fetches the first page on mount and every later page
 * through the read Task. A listed show is always a favorite, so the heart
 * removes it through the shared toggle Task and the current page is
 * refetched afterwards — the backend clamps the envelope when the last
 * page shrinks away. A successful removal toasts the confirmation through
 * the global notify API, a failed one stays silent. Navigation back to
 * the catalogue stays here, at Presenter level: an in-app previous entry is
 * preferred so the parameterized HomePage URL is preserved, while a direct
 * Favorites load opens a fresh HomePage.
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
          notify.info(`"${show.name}" ${TOAST_MESSAGES.REMOVED}`);

          await fetchFavoritesPage(list?.page ?? 1);
        }
      })();
    },
    [list?.page],
  );

  const goToHome = useCallback(() => {
    const historyState = window.history.state as { idx?: number } | null;
    const hasInAppHistory = (historyState?.idx ?? 0) > 0;

    if (hasInAppHistory) navigate(-1);
    else navigate('/');
  }, [navigate]);

  const subHeadText =
    list === null || list.totalCount === 0
      ? 'Shows you mark with the heart button live here.'
      : `${list.totalCount} ${pluralize(
          list.totalCount,
          'show',
        )} saved to your list.`;

  return { list, subHeadText, removeFromFavorites, selectPage, goToHome };
};
