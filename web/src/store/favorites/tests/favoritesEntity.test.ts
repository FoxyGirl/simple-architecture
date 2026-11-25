import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Show } from '~/types';

import { showsReducer } from '../../shows';
import { sessionReducer } from '../../session';
import {
  beginFavoriteToggle,
  favoritesReducer,
  replaceFavoritesListSnapshot,
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectFavoritesCount,
  selectFavoriteShows,
  selectFavoritesHasLoaded,
  selectFavoritesTotalCount,
  selectPendingFavoriteIds,
  settleFavoriteToggle,
} from '..';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

// A store owning the favorites entity: the Entity is independent of any
// other module, so its suite exercises it in isolation. The shows and session
// reducers are mounted only because the RootState selectors are typed against
// the whole store shape.
const createTestStore = () =>
  configureStore({
    reducer: {
      favorites: favoritesReducer,
      shows: showsReducer,
      session: sessionReducer,
    },
  });

describe('favorites entity', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('starts with no favorites and no fetched page', () => {
    expect(store.getState().favorites).toEqual({
      ids: [],
      pendingToggles: {},
      shows: null,
      totalCount: 0,
    });
    expect(selectFavoritesHasLoaded(store.getState())).toBe(false);
  });

  it('replaceFavoritesSummary stores the backend ids and derives the count', () => {
    store.dispatch(replaceFavoritesSummary({ count: 2, ids: [7, 3] }));

    expect(selectFavoriteIds(store.getState())).toEqual([7, 3]);
    expect(selectFavoritesCount(store.getState())).toBe(2);
  });

  it('replaceFavoritesListSnapshot stores the fetched shows and total count verbatim', () => {
    const shows = [show(1, 'Show One'), show(2, 'Show Two')];

    store.dispatch(replaceFavoritesListSnapshot({ shows, totalCount: 5 }));

    expect(selectFavoriteShows(store.getState())).toEqual(shows);
    expect(selectFavoritesTotalCount(store.getState())).toBe(5);
    expect(selectFavoritesHasLoaded(store.getState())).toBe(true);
  });

  it('a pending toggle overlays the backend ids until it settles', () => {
    store.dispatch(replaceFavoritesSummary({ count: 2, ids: [7, 3] }));

    store.dispatch(beginFavoriteToggle({ id: 5, target: true }));
    expect(selectFavoriteIds(store.getState())).toEqual([7, 3, 5]);
    expect(selectFavoritesCount(store.getState())).toBe(3);
    expect(selectPendingFavoriteIds(store.getState())).toEqual([5]);

    store.dispatch(beginFavoriteToggle({ id: 7, target: false }));
    expect(selectFavoriteIds(store.getState())).toEqual([3, 5]);

    // A failed removal settles without a summary: the verbatim ids resurface.
    store.dispatch(settleFavoriteToggle(7));
    expect(selectFavoriteIds(store.getState())).toEqual([7, 3, 5]);

    store.dispatch(settleFavoriteToggle(5));
    expect(selectFavoriteIds(store.getState())).toEqual([7, 3]);
    expect(selectFavoritesCount(store.getState())).toBe(2);
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
  });

  it('the overlay forces its target across a concurrently replaced summary', () => {
    store.dispatch(replaceFavoritesSummary({ count: 1, ids: [7] }));
    store.dispatch(beginFavoriteToggle({ id: 5, target: true }));

    // A summary that predates the pending write on the backend must not
    // drop the optimistic add; the overlay is cleared only by its settle.
    store.dispatch(replaceFavoritesSummary({ count: 0, ids: [] }));
    expect(selectFavoriteIds(store.getState())).toEqual([5]);

    store.dispatch(settleFavoriteToggle(5));
    expect(selectFavoriteIds(store.getState())).toEqual([]);
  });
});
