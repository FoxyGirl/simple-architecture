import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';

import type { FavoritesListPage, Show } from '@api/types';

import { showsReducer } from '../../shows';
import {
  favoritesReducer,
  replaceFavoritesList,
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectFavoritesCount,
  selectFavoritesList,
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
      ids: [],
      count: 0,
      list: null,
    });
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
