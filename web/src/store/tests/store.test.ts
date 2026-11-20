import { describe, expect, it } from 'vitest';

import type { SearchPage, Show } from '@api/types';

import { replaceSearchResult, selectShows, store } from '..';

const result: SearchPage = {
  shows: [{ id: 1, name: 'Show One', genres: ['Drama'] } as Show],
  page: 1,
  pageCount: 2,
  totalCount: 4,
  genres: ['Comedy', 'Drama'],
};

// Plain store smoke — no React involved.
describe('store', () => {
  it('is created with the shows and favorites entities only', () => {
    expect(Object.keys(store.getState()).sort()).toEqual([
      'favorites',
      'shows',
    ]);
    expect(store.getState().shows).toEqual({
      shows: [],
      page: 1,
      pageCount: 1,
      totalCount: 0,
      genres: [],
    });
  });

  it('round-trips a search result through dispatch and the selectors', () => {
    store.dispatch(replaceSearchResult(result));

    expect(store.getState().shows).toEqual(result);
    expect(selectShows(store.getState())).toEqual(result.shows);
  });
});
