import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import type { Show } from '@api/types';
import { notify } from '@notification';
import { selectFavoritesList } from '@store';

import type { FavoritesLocationState } from '../../types';

import { parsePageParam, pluralize } from '../../utils';
import { TOAST_MESSAGES } from '../../constants';
import { fetchFavoritesPage } from '../../tasks/fetchFavoritesPage';
import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The Favorites page Presenter: the URL page is the list's single source of
 * truth, so a single effect drives the read Task on mount and on every page
 * change. A listed show is always a favorite, so the heart removes it through
 * the shared toggle Task and the URL page is refetched afterwards — the
 * backend clamps the envelope when the last page shrinks away, and the URL is
 * not rewritten to the clamped page. A successful removal toasts through the
 * global notify API, a failed one stays silent. Back to Home returns to the
 * HomePage URL remembered by the Favorites entry — navigation state survives
 * reloads and list-page changes, while a direct Favorites load opens `/`.
 */
export const useFavoritesPage = () => {
  const list = useSelector(selectFavoritesList);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePageParam(searchParams.get('page'));
  const fromHome = (location.state as FavoritesLocationState | null)?.fromHome;
  useEffect(() => {
    void fetchFavoritesPage(page);
  }, [page]);

  // A page change is a URL write that pushes a history entry; page 1 omits
  // the parameter.
  const selectPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams);

      if (nextPage > 1) params.set('page', String(nextPage));
      else params.delete('page');

      setSearchParams(params, { state: location.state });
    },
    [searchParams, setSearchParams, location.state],
  );

  const removeFromFavorites = useCallback(
    (show: Show) => {
      void (async () => {
        const result = await toggleShowFavorite(show, true);

        if (result.status === 'success') {
          notify.info(`"${show.name}" ${TOAST_MESSAGES.REMOVED}`);

          await fetchFavoritesPage(page);
        }
      })();
    },
    [page],
  );

  const goToHome = useCallback(() => {
    navigate(fromHome ?? '/');
  }, [fromHome, navigate]);

  const subHeadText =
    list === null || list.totalCount === 0
      ? 'Shows you mark with the heart button live here.'
      : `${list.totalCount} ${pluralize(
          list.totalCount,
          'show',
        )} saved to your list.`;

  return { list, subHeadText, removeFromFavorites, selectPage, goToHome };
};
