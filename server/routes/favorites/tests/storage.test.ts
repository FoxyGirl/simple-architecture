import { beforeEach, describe, expect, it } from 'vitest';

import type { Show } from '@server/types';
import {
  addFavorite,
  favorite,
  getFavoritesListPage,
  getFavoritesSummary,
  removeFavorite,
} from '../storage';

const show = (id: number): Show =>
  ({ id, name: `Show ${id}`, genres: [] as string[] }) as Show;

describe('favorites storage', () => {
  beforeEach(() => {
    for (const key of Object.keys(favorite)) delete favorite[Number(key)];
  });

  it('addFavorite stores the full show snapshot keyed by its id', () => {
    const added = show(11);
    addFavorite(added);

    expect(favorite[11]).toBe(added);
    expect(Object.keys(favorite)).toEqual(['11']);
  });

  it('addFavorite keeps one entry when the same id is added twice', () => {
    addFavorite(show(11));
    addFavorite(show(11));

    expect(getFavoritesSummary()).toEqual({ count: 1, ids: [11] });
  });

  it('removeFavorite deletes the entry', () => {
    addFavorite(show(11));
    addFavorite(show(12));
    removeFavorite(11);

    expect(favorite[11]).toBeUndefined();
    expect(getFavoritesSummary()).toEqual({ count: 1, ids: [12] });
  });

  it('removeFavorite on an unknown id is a no-op', () => {
    addFavorite(show(11));
    removeFavorite(999);

    expect(getFavoritesSummary()).toEqual({ count: 1, ids: [11] });
  });

  it('getFavoritesSummary reports count and ids in insertion order', () => {
    for (const id of [11, 12, 13]) addFavorite(show(id));

    expect(getFavoritesSummary()).toEqual({ count: 3, ids: [11, 12, 13] });
  });

  it('getFavoritesListPage slices 3 shows per page with metadata', () => {
    for (const id of [1, 2, 3, 4, 5, 6, 7]) addFavorite(show(id));

    const first = getFavoritesListPage(1);

    expect(first).toEqual({
      shows: [show(1), show(2), show(3)],
      page: 1,
      pageCount: 3,
      totalCount: 7,
    });

    expect(getFavoritesListPage(2).shows).toEqual([show(4), show(5), show(6)]);
    expect(getFavoritesListPage(3).shows).toEqual([show(7)]);
  });

  it('getFavoritesListPage clamps the requested page into [1, pageCount]', () => {
    for (const id of [1, 2, 3, 4]) addFavorite(show(id));

    expect(getFavoritesListPage(0)).toMatchObject({ page: 1 });
    expect(getFavoritesListPage(999)).toEqual({
      shows: [show(4)],
      page: 2,
      pageCount: 2,
      totalCount: 4,
    });
  });

  it('an empty storage yields one empty page', () => {
    expect(getFavoritesListPage(1)).toEqual({
      shows: [],
      page: 1,
      pageCount: 1,
      totalCount: 0,
    });
  });
});
