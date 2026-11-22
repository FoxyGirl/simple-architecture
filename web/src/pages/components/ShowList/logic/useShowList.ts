import { useSelector } from 'react-redux';

import { selectFavoriteIds } from '~/store';
import { useFavoriteToggle } from '~/pages/hooks/useFavoriteToggle';

import type { ShowListProps } from '../types';

/**
 * The ShowList presenter: by default the hearts read the favorite ids the
 * Entity mirrors from the backend, and the toggle is the shared Task's
 * business rule with the shared toast aspect — so a consumer like the
 * HomePage passes no favorites props at all. A consumer that owns a
 * different favorite state (the Favorites page's soft-removal marking, where
 * the backend owns the list and removals are local) injects its own
 * `isFavorite`/`onToggleFavorite`, which take precedence over the Entity.
 */
export const useShowList = ({
  isFavorite,
  onToggleFavorite,
}: ShowListProps) => {
  const favoriteIds = useSelector(selectFavoriteIds);

  const storedIsFavorite = (showId: number) => favoriteIds.includes(showId);
  const storedToggleFavorite = useFavoriteToggle(storedIsFavorite);

  return {
    isFavorite: isFavorite ?? storedIsFavorite,
    toggleFavorite: onToggleFavorite ?? storedToggleFavorite,
  };
};
