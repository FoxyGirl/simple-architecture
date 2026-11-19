import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { Show } from '@api/types';
import { selectFavoriteShows } from '@store';

import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The Favorites page Presenter: reads the favorites Entity through its
 * selector, removes a show through the shared toggle Task (a listed show
 * is always a favorite, so the toggle removes it), and owns navigation
 * back to the catalogue.
 */
export const useFavoritesPage = () => {
  const favorites = useSelector(selectFavoriteShows);
  const navigate = useNavigate();

  const removeFromFavorites = useCallback((show: Show) => {
    toggleShowFavorite(show, true);
  }, []);

  const goToCatalogue = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return { favorites, removeFromFavorites, goToCatalogue };
};
