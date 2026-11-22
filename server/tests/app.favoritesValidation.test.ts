import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';

import {
  deleteFavorite,
  login,
  postFavorite,
  resetStores,
} from './favorites-probe';

const EMAIL = 'ada@example.com';

describe('favorites API validation', () => {
  let cookie: string;

  beforeEach(async () => {
    resetStores();
    cookie = await login(EMAIL);
  });

  it('POST /api/favorites returns 400 without a valid show', async () => {
    const bodies = [{}, { show: { name: 'No id' } }];

    for (const body of bodies) {
      const response = await request(createApp())
        .post('/api/favorites')
        .set('Cookie', cookie)
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: expect.any(String) });
    }
  });

  it('DELETE with an unknown id is a no-op, a non-numeric id is a 400', async () => {
    await postFavorite(cookie, 11);

    const unknown = await deleteFavorite(cookie, 999);

    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual({ count: 1, ids: [11] });

    const invalid = await request(createApp())
      .delete('/api/favorites/abc')
      .set('Cookie', cookie);

    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ error: expect.any(String) });
  });
});
