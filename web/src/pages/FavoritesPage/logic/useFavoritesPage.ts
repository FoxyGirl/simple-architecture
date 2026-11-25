import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectFavoriteShows, selectFavoritesCount } from '~/store';

import { pluralize, readFromHome } from '~/pages/utils';
import { syncFavoritesSummary } from '~/pages/tasks/syncFavoritesSummary';
import { fetchFavoritesPage } from './tasks/fetchFavoritesPage';
import { useSoftRemoval } from './useSoftRemoval';
import { useUrlFavoriteState } from './useUrlFavoriteState';

/**
 * The Favorites page Presenter: fetches the URL page on mount and on every
 * page change, keeping only `isLoading` locally while the Entity stores the
 * page's shows and backend total count. The subhead reads the live favorite
 * count; soft removal flips its marking optimistically and keeps removed
 * cards listed until the next fetch. Back to Home restores the remembered
 * Home URL.
 */
export const useFavoritesPage = () => {
  const shows = useSelector(selectFavoriteShows);
  const favoritesCount = useSelector(selectFavoritesCount);
  const navigate = useNavigate();
  const location = useLocation();
  const fromHome = readFromHome(location.state);

  const { page, selectPage, pageCount } = useUrlFavoriteState();
  const { isFavorite, isRemoved, toggleFavorite } = useSoftRemoval(shows || []);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    void syncFavoritesSummary();
  }, []);

  useEffect(() => {
    const getFavorites = async () => {
      setIsLoading(true);
      await fetchFavoritesPage(page);
      setIsLoading(false);
    };

    getFavorites();
  }, [page]);

  const goToHome = () => {
    navigate(fromHome ?? '/');
  };

  const subHeadText =
    favoritesCount === 0
      ? 'Shows you mark with the heart button live here.'
      : `${favoritesCount} ${pluralize(favoritesCount, 'show')} saved to your list.`;

  return {
    shows,
    page,
    pageCount,
    isLoading,
    subHeadText,
    isFavorite,
    isRemoved,
    toggleFavorite,
    selectPage,
    goToHome,
  };
};
