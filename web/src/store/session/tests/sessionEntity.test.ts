import { beforeEach, describe, expect, it } from 'vitest';

import {
  beginFavoriteToggle,
  clearFavorites,
  clearSession,
  replaceFavoritesListSnapshot,
  replaceFavoritesSummary,
  replaceSession,
  selectFavoriteIds,
  selectFavoritesCount,
  selectFavoriteShows,
  selectFavoritesTotalCount,
  selectIsAuthenticated,
  selectSessionEmail,
  store,
} from '~/store';
import type { Show } from '~/types';

const show = (id: number): Show => ({ id, name: `Show ${id}` }) as Show;

const EMPTY_FAVORITES = {
  ids: [],
  pendingToggles: {},
  shows: null,
  totalCount: 0,
};

describe('session entity', () => {
  beforeEach(() => {
    store.dispatch(clearSession());
    store.dispatch(clearFavorites());
  });

  it('starts signed out', () => {
    expect(selectSessionEmail(store.getState())).toBeNull();
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });

  it('replaceSession stores the backend email verbatim', () => {
    store.dispatch(replaceSession({ email: 'ada@example.com' }));

    expect(selectSessionEmail(store.getState())).toBe('ada@example.com');
    expect(selectIsAuthenticated(store.getState())).toBe(true);

    store.dispatch(replaceSession({ email: null }));

    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });

  it('clearSession returns to the signed-out state', () => {
    store.dispatch(replaceSession({ email: 'ada@example.com' }));

    store.dispatch(clearSession());

    expect(selectSessionEmail(store.getState())).toBeNull();
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });

  it('clearFavorites resets ids, pending toggles, shows and total count', () => {
    store.dispatch(replaceFavoritesSummary({ count: 2, ids: [7, 3] }));
    store.dispatch(
      replaceFavoritesListSnapshot({ shows: [show(7)], totalCount: 2 }),
    );
    store.dispatch(beginFavoriteToggle({ id: 9, target: true }));

    store.dispatch(clearFavorites());

    expect(store.getState().favorites).toEqual(EMPTY_FAVORITES);
    expect(selectFavoriteIds(store.getState())).toEqual([]);
    expect(selectFavoritesCount(store.getState())).toBe(0);
    expect(selectFavoriteShows(store.getState())).toBeNull();
    expect(selectFavoritesTotalCount(store.getState())).toBe(0);
  });
});
