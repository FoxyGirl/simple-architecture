import request from 'supertest';

import { createApp } from '@server/app';
import { sessions } from '@server/auth';
import { favoritesByEmail } from '@server/routes/favorites';
import type { Show } from '@server/types';

// Shared supertest probes for the favorites app-level suites: every helper
// authenticates through the real login endpoint and replays the returned
// session cookie explicitly, so no suite depends on a shared cookie jar.
type Headers = Record<string, string | string[] | undefined>;

const setCookieOf = (response: { headers: Headers }): string => {
  const header = response.headers['set-cookie'];
  const value = Array.isArray(header) ? header[0] : header;

  return typeof value === 'string' ? value : '';
};

const cookieOf = (response: { headers: Headers }): string =>
  setCookieOf(response).split(';')[0] ?? '';

export const show = (id: number): Show =>
  ({ id, name: `Show ${id}`, genres: ['Drama'] }) as Show;

export const login = async (email: string): Promise<string> =>
  cookieOf(await request(createApp()).post('/api/auth/login').send({ email }));

export const postFavorite = (cookie: string, id: number) =>
  request(createApp())
    .post('/api/favorites')
    .set('Cookie', cookie)
    .send({ show: show(id) });

export const getFavoriteCount = (cookie: string) =>
  request(createApp()).get('/api/favorites/count').set('Cookie', cookie);

export const getFavoritesPage = (cookie: string, page: number) =>
  request(createApp()).get(`/api/favorites?page=${page}`).set('Cookie', cookie);

export const deleteFavorite = (cookie: string, id: number) =>
  request(createApp()).delete(`/api/favorites/${id}`).set('Cookie', cookie);

export const logout = (cookie: string) =>
  request(createApp()).post('/api/auth/logout').set('Cookie', cookie);

export const me = (cookie: string) =>
  request(createApp()).get('/api/auth/me').set('Cookie', cookie);

/** The restart stand-in: both in-memory stores lose everything. */
export const resetStores = (): void => {
  for (const email of Object.keys(favoritesByEmail)) {
    delete favoritesByEmail[email];
  }
  for (const token of Object.keys(sessions)) delete sessions[token];
};
