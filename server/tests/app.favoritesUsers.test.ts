import { beforeEach, describe, expect, it } from 'vitest';

import {
  getFavoriteCount,
  getFavoritesPage,
  login,
  logout,
  me,
  postFavorite,
  resetStores,
} from './favorites-probe';

const ADA = 'ada@example.com';
const GRACE = 'grace@example.com';

describe('per-user favorites API', () => {
  beforeEach(() => {
    resetStores();
  });

  it("keeps one email's favorites out of another email's view", async () => {
    const ada = await login(ADA);

    await postFavorite(ada, 11);
    await postFavorite(ada, 12);

    const grace = await login(GRACE);

    expect((await getFavoriteCount(grace)).body).toEqual({
      count: 0,
      ids: [],
    });
    expect((await getFavoritesPage(grace, 1)).body).toEqual({
      shows: [],
      page: 1,
      pageCount: 1,
      totalCount: 0,
    });

    expect((await getFavoriteCount(ada)).body).toEqual({
      count: 2,
      ids: [11, 12],
    });
    expect((await getFavoritesPage(ada, 1)).body).toMatchObject({
      shows: [{ id: 11 }, { id: 12 }],
      totalCount: 2,
    });
  });

  it('restores the same list after a logout and a login with the same email', async () => {
    const first = await login(ADA);

    await postFavorite(first, 11);
    await postFavorite(first, 12);
    await logout(first);

    const again = await login(ADA);

    expect((await getFavoriteCount(again)).body).toEqual({
      count: 2,
      ids: [11, 12],
    });
    expect((await getFavoritesPage(again, 1)).body).toMatchObject({
      shows: [{ id: 11 }, { id: 12 }],
      totalCount: 2,
    });

    const other = await login(GRACE);

    expect((await getFavoriteCount(other)).body).toEqual({
      count: 0,
      ids: [],
    });
  });

  it('the restart stand-in clears sessions and every favorites list', async () => {
    const ada = await login(ADA);
    const grace = await login(GRACE);

    await postFavorite(ada, 11);
    await postFavorite(grace, 12);

    resetStores();

    expect((await me(ada)).status).toBe(401);
    expect((await me(grace)).status).toBe(401);

    const fresh = await login(ADA);

    expect((await getFavoriteCount(fresh)).body).toEqual({
      count: 0,
      ids: [],
    });
  });
});
