import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { selectFavoritesList } from '~/store';

import type { FavoritesLocationState } from '../../types';

import { parsePageParam, pluralize } from '../../utils';
import { fetchFavoritesPage } from './tasks/fetchFavoritesPage';
import { useSoftRemoval } from './useSoftRemoval';

/**
 * The Favorites page Presenter: the URL page is the list's single source of
 * truth, so a single effect drives the read Task on mount and on every page
 * change. Removals and re-adds run through the shared toggle Task and the
 * soft-removal aspect keeps a removed show listed with its heart unpressed —
 * the list is refetched only by the next fresh fetch (a page change, a
 * remount or a reload), never after a toggle. Back to Home returns to the
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

  const { isFavorite, isRemoved, toggleFavorite } = useSoftRemoval(list);

  // A page change is a URL write that pushes a history entry; page 1 omits
  // the parameter.
  const selectPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams);

      if (nextPage > 1) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }

      setSearchParams(params, { state: location.state });
    },
    [searchParams, setSearchParams, location.state],
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

  return {
    list,
    subHeadText,
    isFavorite,
    isRemoved,
    toggleFavorite,
    selectPage,
    goToHome,
  };
};
