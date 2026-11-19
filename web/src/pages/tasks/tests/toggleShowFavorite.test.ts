import { beforeEach, describe, expect, it } from 'vitest';

import type { Show } from '@api/types';
import { removeFavorite, selectFavoriteShows, store } from '@store';

import { toggleShowFavorite } from '../toggleShowFavorite';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const favoriteIds = () =>
  selectFavoriteShows(store.getState()).map((favorite) => favorite.id);

describe('toggleShowFavorite task', () => {
  beforeEach(() => {
    // Empty the Entity — every test starts from a clean favorites list.
    for (const id of favoriteIds()) store.dispatch(removeFavorite(id));
  });

  it('adds a show that is not a favorite yet', () => {
    toggleShowFavorite(show(1, 'Show One'), false);

    expect(favoriteIds()).toEqual([1]);
  });

  it('removes a show that is already a favorite', () => {
    toggleShowFavorite(show(1, 'Show One'), false);

    toggleShowFavorite(show(1, 'Show One'), true);

    expect(favoriteIds()).toEqual([]);
  });

  it('stores the whole show so the Favorites page can render it', () => {
    toggleShowFavorite(show(2, 'Show Two'), false);

    expect(selectFavoriteShows(store.getState())).toEqual([
      show(2, 'Show Two'),
    ]);
  });
});
