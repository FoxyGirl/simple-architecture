import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';

import type { FavoritesListPage, Show } from '@api/types';

import { showsReducer } from '../../shows';
import {
  addFavorite,
  favoritesReducer,
  removeFavorite,
  replaceFavoritesList,
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectFavoritesCount,
  selectFavoritesList,
  selectFavoriteShows,
} from '..';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

// A store owning the favorites entity: the Entity is independent of any
// other module, so its suite exercises it in isolation. The shows reducer is
// mounted only because the RootState selectors are typed against the whole
// store shape.
const createTestStore = () =>
  configureStore({
    reducer: { favorites: favoritesReducer, shows: showsReducer },
  });

describe('favorites entity', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('starts with an empty favorites list', () => {
    expect(store.getState().favorites).toEqual({
      shows: [],
      ids: [],
      count: 0,
      list: null,
    });
  });

  it('stores an added show', () => {
    store.dispatch(addFavorite(show(1, 'Show One')));

    expect(selectFavoriteShows(store.getState())).toEqual([
      show(1, 'Show One'),
    ]);
  });

  it('keeps the insertion order of several favorites', () => {
    store.dispatch(addFavorite(show(1, 'Show One')));
    store.dispatch(addFavorite(show(2, 'Show Two')));

    expect(selectFavoriteShows(store.getState()).map((s) => s.id)).toEqual([
      1, 2,
    ]);
  });

  it('ignores adding an already-favorited show', () => {
    store.dispatch(addFavorite(show(1, 'Show One')));
    store.dispatch(addFavorite(show(1, 'Show One')));

    expect(selectFavoriteShows(store.getState())).toHaveLength(1);
  });

  it('removes a favorited show by id', () => {
    store.dispatch(addFavorite(show(1, 'Show One')));
    store.dispatch(addFavorite(show(2, 'Show Two')));

    store.dispatch(removeFavorite(1));

    expect(selectFavoriteShows(store.getState()).map((s) => s.id)).toEqual([2]);
  });

  it('ignores removing an unknown id', () => {
    store.dispatch(addFavorite(show(1, 'Show One')));

    store.dispatch(removeFavorite(99));

    expect(selectFavoriteShows(store.getState())).toHaveLength(1);
  });

  it('replaceFavoritesSummary stores the backend ids and count verbatim', () => {
    store.dispatch(replaceFavoritesSummary({ count: 2, ids: [7, 3] }));

    expect(selectFavoriteIds(store.getState())).toEqual([7, 3]);
    expect(selectFavoritesCount(store.getState())).toBe(2);
  });

  it('replaceFavoritesList stores the page envelope verbatim', () => {
    const listPage: FavoritesListPage = {
      shows: [show(1, 'Show One')],
      page: 2,
      pageCount: 2,
      totalCount: 4,
    };

    store.dispatch(replaceFavoritesList(listPage));

    expect(selectFavoritesList(store.getState())).toEqual(listPage);
  });
});
