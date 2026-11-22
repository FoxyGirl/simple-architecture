import { useState } from 'react';

import type { Show } from '~/types';
import type { RemovedMarking } from '../types';

import { useFavoriteToggle } from '~/pages/hooks/useFavoriteToggle';

/**
 * The soft-removal aspect of the Favorites page presenter: the backend stays
 * the list's source of truth, so a toggle never refetches the page — the
 * removed ids are view state of the current fetched shows. The marking
 * carries the shows array it was made against, so every fresh fetch (a page
 * change, a re-visit or a reload) invalidates it automatically. The shared
 * toggle aspect runs the Task and owns the toasts; on success it reports the
 * card's previous state through the callback so the marking flips here, at
 * Presenter level, while a failure leaves the card as it was.
 */
export const useSoftRemoval = (shows: Show[]) => {
  const [marking, setMarking] = useState<RemovedMarking>({ shows, ids: [] });
  const removedIds = marking.shows === shows ? marking.ids : [];

  const isRemoved = (showId: number) => removedIds.includes(showId);
  const isFavorite = (showId: number) => !removedIds.includes(showId);

  const toggleFavorite = useFavoriteToggle(isFavorite, (show, wasFavorite) => {
    setMarking({
      shows,
      ids: wasFavorite
        ? [...removedIds, show.id]
        : removedIds.filter((id) => id !== show.id),
    });
  });

  return { isFavorite, isRemoved, toggleFavorite };
};
