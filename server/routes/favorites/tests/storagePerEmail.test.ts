import { beforeEach, describe, expect, it } from 'vitest';

import {
  addFavorite,
  favoritesByEmail,
  getFavoritesListPage,
  getFavoritesSummary,
} from '../storage';

import { ADA, clearAll, GRACE, show } from './fixtures';

describe('per-email favorites storage', () => {
  beforeEach(clearAll);

  it("slices each email's list into its own pages", () => {
    for (const id of [1, 2, 3, 4, 5, 6, 7]) addFavorite(ADA, show(id));
    addFavorite(GRACE, show(11));

    expect(getFavoritesListPage(ADA, 1)).toEqual({
      shows: [show(1), show(2), show(3)],
      page: 1,
      pageCount: 3,
      totalCount: 7,
    });
    expect(getFavoritesListPage(ADA, 2).shows).toEqual([
      show(4),
      show(5),
      show(6),
    ]);
    expect(getFavoritesListPage(GRACE, 1)).toEqual({
      shows: [show(11)],
      page: 1,
      pageCount: 1,
      totalCount: 1,
    });
  });

  it('clamps each email page into its own [1, pageCount]', () => {
    for (const id of [1, 2, 3, 4]) addFavorite(ADA, show(id));

    expect(getFavoritesListPage(ADA, 0)).toMatchObject({ page: 1 });
    expect(getFavoritesListPage(ADA, 999)).toEqual({
      shows: [show(4)],
      page: 2,
      pageCount: 2,
      totalCount: 4,
    });
  });

  it('an unknown email yields the empty summary and one empty page', () => {
    expect(getFavoritesSummary(GRACE)).toEqual({ count: 0, ids: [] });
    expect(getFavoritesListPage(GRACE, 1)).toEqual({
      shows: [],
      page: 1,
      pageCount: 1,
      totalCount: 0,
    });
  });

  it('the exported seam resets every email list', () => {
    addFavorite(ADA, show(11));
    addFavorite(GRACE, show(12));

    clearAll();

    expect(favoritesByEmail).toEqual({});
    expect(getFavoritesSummary(ADA)).toEqual({ count: 0, ids: [] });
    expect(getFavoritesSummary(GRACE)).toEqual({ count: 0, ids: [] });
  });
});
