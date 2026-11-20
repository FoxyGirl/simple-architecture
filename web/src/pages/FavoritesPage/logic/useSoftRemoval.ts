import { useState } from 'react';

import type { FavoritesListPage, Show } from '@api/types';
import { notify } from '@notification';

import type { RemovedMarking } from '../types';

import { TOAST_MESSAGES } from '../../constants';
import { toggleShowFavorite } from '../../tasks/toggleShowFavorite';

/**
 * The soft-removal aspect of the Favorites page presenter: the backend stays
 * the list's source of truth, so a toggle never refetches the page — the
 * removed ids are view state of the current fetched list. The marking
 * carries the envelope it was made against, so every fresh fetch (a page
 * change, a re-visit or a reload) invalidates it automatically. The shared
 * toggle Task receives the card's current state; only a success flips the
 * marking and toasts, a failure leaves the card as it was.
 */
export const useSoftRemoval = (list: FavoritesListPage | null) => {
  const [marking, setMarking] = useState<RemovedMarking>({ list, ids: [] });
  const removedIds = marking.list === list ? marking.ids : [];

  const isRemoved = (showId: number) => removedIds.includes(showId);
  const isFavorite = (showId: number) => !removedIds.includes(showId);

  const toggleFavorite = (show: Show) => {
    const wasFavorite = !removedIds.includes(show.id);

    void (async () => {
      const result = await toggleShowFavorite(show, wasFavorite);

      if (result.status !== 'success') return;

      setMarking({
        list,
        ids: wasFavorite
          ? [...removedIds, show.id]
          : removedIds.filter((id) => id !== show.id),
      });

      if (wasFavorite) {
        notify.info(`"${show.name}" ${TOAST_MESSAGES.REMOVED}`);
      } else {
        notify.success(`"${show.name}" ${TOAST_MESSAGES.ADDED}`);
      }
    })();
  };

  return { isFavorite, isRemoved, toggleFavorite };
};
