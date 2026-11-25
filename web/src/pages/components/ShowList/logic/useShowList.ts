import { useSelector } from 'react-redux';

import {
  selectFavoriteIds,
  selectIsAuthenticated,
  selectPendingFavoriteIds,
} from '~/store';
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
 *
 * The pending registry is not overridable: it comes from the same Entity
 * overlay the shared Task writes, so the heart of the show whose toggle is
 * in flight is disabled on both pages and both card layouts.
 *
 * Favorites are a signed-in feature: `canFavorite` comes from the session
 * Entity for both pages and both layouts, so the cards hide the heart while
 * signed out even when a consumer injects its own favorites aspect.
 */
export const useShowList = ({
  isFavorite,
  onToggleFavorite,
}: ShowListProps) => {
  const favoriteIds = useSelector(selectFavoriteIds);
  const pendingFavoriteIds = useSelector(selectPendingFavoriteIds);
  const canFavorite = useSelector(selectIsAuthenticated);

  const storedIsFavorite = (showId: number) => favoriteIds.includes(showId);
  const storedToggleFavorite = useFavoriteToggle(storedIsFavorite);
  const isPending = (showId: number) => pendingFavoriteIds.includes(showId);

  return {
    canFavorite,
    isFavorite: isFavorite ?? storedIsFavorite,
    isPending,
    toggleFavorite: onToggleFavorite ?? storedToggleFavorite,
  };
};
