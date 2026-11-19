import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { Show } from '@api/types';
import { selectFavoriteShows } from '@store';

import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The favorites aspect of the home page presenter: reads the favorites
 * Entity through its selector and exposes the membership test plus the
 * toggle handler the cards' heart buttons need. The toggle rule itself
 * lives in the shared Task.
 */
export const useShowFavorites = () => {
  const favoriteShows = useSelector(selectFavoriteShows);

  const isFavorite = useCallback(
    (showId: number) =>
      favoriteShows.some((favorite) => favorite.id === showId),
    [favoriteShows],
  );

  const toggleFavorite = useCallback(
    (show: Show) => {
      toggleShowFavorite(
        show,
        favoriteShows.some((favorite) => favorite.id === show.id),
      );
    },
    [favoriteShows],
  );

  return { isFavorite, toggleFavorite };
};
