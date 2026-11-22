import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';

import {
  getFavoriteCount,
  login,
  postFavorite,
  resetStores,
  show,
} from './favorites-probe';

const EMAIL = 'ada@example.com';

describe('favorites API session enforcement', () => {
  let cookie: string;

  beforeEach(async () => {
    resetStores();
    cookie = await login(EMAIL);
    await postFavorite(cookie, 11);
  });

  it('rejects all four endpoints without a session and changes no list', async () => {
    const responses = [
      await request(createApp())
        .post('/api/favorites')
        .send({ show: show(12) }),
      await request(createApp()).get('/api/favorites/count'),
      await request(createApp()).get('/api/favorites?page=1'),
      await request(createApp()).delete('/api/favorites/11'),
    ];

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: expect.any(String) });
    }

    // The rejected add is absent and the rejected delete changed nothing.
    const summary = await getFavoriteCount(cookie);

    expect(summary.body).toEqual({ count: 1, ids: [11] });
  });

  it('checks the session before the request body', async () => {
    const invalid = await request(createApp())
      .post('/api/favorites')
      .send({ name: 'not a favorites body' });

    expect(invalid.status).toBe(401);
    expect(invalid.body).toEqual({ error: expect.any(String) });
  });
});
