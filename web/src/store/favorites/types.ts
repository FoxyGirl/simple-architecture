import type { Show } from '~/types';

/**
 * The optimistic mark of an in-flight toggle write: the show id and the
 * favorite state the write targets. The toggle Task begins it before the
 * request and settles it when the request completes — it never holds
 * authoritative data.
 */
export type PendingToggle = {
  id: number;
  target: boolean;
};

/**
 * The favorites Entity state: the backend-synced mirror plus the transient
 * overlay of in-flight toggles. The favorite `ids` — what the heart states
 * read — plus the shows and total count of the last fetched favorites page
 * are stored verbatim as the backend reports them. `pendingToggles` records
 * the optimistic target of every running toggle write (show id -> target
 * favorite state); the selectors overlay it on the mirrored ids, and it is
 * cleared on every settle. The backend owns the favorites storage; the
 * client mirrors it and holds no authoritative data. The page metadata of
 * the list fetch (page and page count) lives in the Favorites page
 * Presenter, not here. No presentation state. `clearFavorites` restores this
 * empty state on sign-in, logout and a failed boot restore, so the Entity
 * never carries another user's data.
 */
export type FavoritesState = {
  ids: number[];
  pendingToggles: Record<number, boolean>;
  shows: Show[] | null;
  totalCount: number;
};
