import { beforeEach, describe, expect, it } from 'vitest';

import {
  addFavorite,
  favoritesByEmail,
  getFavoritesSummary,
  removeFavorite,
} from '../storage';

import { ADA, clearAll, GRACE, show } from './fixtures';

describe('favorites storage', () => {
  beforeEach(clearAll);

  it('stores a show snapshot under its email only', () => {
    const added = show(11);
    addFavorite(ADA, added);

    expect(favoritesByEmail[ADA]?.[11]).toBe(added);
    expect(favoritesByEmail[GRACE]).toBeUndefined();
    expect(getFavoritesSummary(GRACE)).toEqual({ count: 0, ids: [] });
  });

  it('re-adding a known id keeps its position and entry count', () => {
    addFavorite(ADA, show(11));
    addFavorite(ADA, show(12));
    addFavorite(ADA, show(11));

    expect(getFavoritesSummary(ADA)).toEqual({ count: 2, ids: [11, 12] });
  });

  it('removes from one email and ignores unknown ids or emails', () => {
    addFavorite(ADA, show(11));
    addFavorite(GRACE, show(11));

    removeFavorite(ADA, 11);
    removeFavorite(ADA, 999);
    removeFavorite('unknown@example.com', 11);

    expect(favoritesByEmail[ADA]?.[11]).toBeUndefined();
    expect(getFavoritesSummary(ADA)).toEqual({ count: 0, ids: [] });
    expect(getFavoritesSummary(GRACE)).toEqual({ count: 1, ids: [11] });
  });

  it('reports count and ids in the record integer-key order', () => {
    for (const id of [11, 12, 13]) addFavorite(ADA, show(id));

    expect(getFavoritesSummary(ADA)).toEqual({
      count: 3,
      ids: [11, 12, 13],
    });
  });
});
