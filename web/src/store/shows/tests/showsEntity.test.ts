import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';

import type { SearchPage, Show } from '@api/types';

import { favoritesReducer } from '../../favorites';
import { searchSessionReducer } from '../../searchSession';
import {
  replaceSearchResult,
  selectGenres,
  selectPage,
  selectPageCount,
  selectShows,
  selectTotalCount,
  showsReducer,
} from '..';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const result: SearchPage = {
  shows: [show(1, 'Show One'), show(2, 'Show Two')],
  page: 2,
  pageCount: 3,
  totalCount: 7,
  genres: ['Comedy', 'Drama'],
};

// A store owning the shows entity: the Entity is independent of any other
// module, so its suite exercises it in isolation. The favorites reducer is
// mounted only because the RootState selectors are typed against the whole
// store shape.
const createTestStore = () =>
  configureStore({
    reducer: {
      shows: showsReducer,
      favorites: favoritesReducer,
      searchSession: searchSessionReducer,
    },
  });

describe('shows entity', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('starts with an empty search result', () => {
    expect(store.getState().shows).toEqual({
      shows: [],
      page: 1,
      pageCount: 1,
      totalCount: 0,
      genres: [],
    });
  });

  it('holds no request-status or UI-related field', () => {
    store.dispatch(replaceSearchResult(result));

    expect(Object.keys(store.getState().shows).sort()).toEqual([
      'genres',
      'page',
      'pageCount',
      'shows',
      'totalCount',
    ]);
  });

  it('stores a fetched search result', () => {
    store.dispatch(replaceSearchResult(result));

    expect(store.getState().shows).toEqual(result);
  });

  it('exposes the shows list and the metadata through selectors', () => {
    store.dispatch(replaceSearchResult(result));
    const state = store.getState();

    expect(selectShows(state)).toEqual(result.shows);
    expect(selectPage(state)).toBe(2);
    expect(selectPageCount(state)).toBe(3);
    expect(selectTotalCount(state)).toBe(7);
    expect(selectGenres(state)).toEqual(['Comedy', 'Drama']);
  });
});
