import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Show } from '~/types';

import { showsReducer } from '../../shows';
import {
  favoritesReducer,
  replaceFavoritesListSnapshot,
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectFavoritesCount,
  selectFavoriteShows,
  selectFavoritesHasLoaded,
  selectFavoritesTotalCount,
} from '..';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

// A store owning the favorites entity: the Entity is independent of any
// other module, so its suite exercises it in isolation. The shows reducer is
// mounted only because the RootState selectors are typed against the whole
// store shape.
const createTestStore = () =>
  configureStore({
    reducer: {
      favorites: favoritesReducer,
      shows: showsReducer,
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
});
