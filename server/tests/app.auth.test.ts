import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '@server/app';
import { SESSION_COOKIE_NAME, sessions } from '@server/auth';

type Headers = Record<string, string | string[] | undefined>;

const setCookieOf = (response: { headers: Headers }): string => {
  const header = response.headers['set-cookie'];
  const value = Array.isArray(header) ? header[0] : header;

  return typeof value === 'string' ? value : '';
};

const cookieOf = (response: { headers: Headers }): string =>
  setCookieOf(response).split(';')[0] ?? '';

const login = (email: unknown) =>
  request(createApp()).post('/api/auth/login').send({ email });

const me = (cookie: string) =>
  request(createApp()).get('/api/auth/me').set('Cookie', cookie);

const logout = (cookie: string) =>
  request(createApp()).post('/api/auth/logout').set('Cookie', cookie);

describe('auth API', () => {
  let mockedFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset the session seam; the mocked fetch proves auth never hits TVmaze.
    for (const token of Object.keys(sessions)) delete sessions[token];
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POST /api/auth/login normalizes the email and sets a session cookie', async () => {
    const response = await login('  A@B.Co  ');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ email: 'a@b.co' });

    const header = setCookieOf(response);
    expect(header.startsWith(`${SESSION_COOKIE_NAME}=`)).toBe(true);
    expect(header).toContain('Path=/');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).not.toContain('Max-Age');
  });

  it('POST /api/auth/login rejects an empty or non-email value without a cookie', async () => {
    for (const email of ['', '   ', 'not-an-email']) {
      const response = await login(email);

      expect(response.status).toBe(400);
      expect(typeof response.body.error).toBe('string');
      expect(response.headers['set-cookie']).toBeUndefined();
    }
    expect(Object.keys(sessions)).toHaveLength(0);
  });

  it('GET /api/auth/me resolves a replayed cookie and rejects a missing one', async () => {
    const cookie = cookieOf(await login('a@b.co'));

    const resolved = await me(cookie);

    expect(resolved.status).toBe(200);
    expect(resolved.body).toEqual({ email: 'a@b.co' });

    const missing = await request(createApp()).get('/api/auth/me');

    expect(missing.status).toBe(401);
    expect(typeof missing.body.error).toBe('string');
  });

  it('POST /api/auth/logout invalidates the token, clears the cookie and is idempotent', async () => {
    const cookie = cookieOf(await login('a@b.co'));

    const first = await logout(cookie);

    expect(first.status).toBe(200);
    expect(first.body).toEqual({ email: null });
    expect(setCookieOf(first)).toContain('Max-Age=0');
    expect((await me(cookie)).status).toBe(401);
    expect((await logout(cookie)).status).toBe(200);
  });

  it('a login after a logout issues a working token again', async () => {
    const oldCookie = cookieOf(await login('a@b.co'));
    await logout(oldCookie);

    const fresh = await login('A@B.co');

    expect((await me(cookieOf(fresh))).body).toEqual({ email: 'a@b.co' });
  });

  it('clearing the session store invalidates tokens; a fresh login works', async () => {
    const oldCookie = cookieOf(await login('a@b.co'));

    for (const token of Object.keys(sessions)) delete sessions[token];

    expect((await me(oldCookie)).status).toBe(401);

    const again = await login('a@b.co');

    expect((await me(cookieOf(again))).status).toBe(200);
  });

  it('answers auth requests without any upstream TVmaze call', async () => {
    const cookie = cookieOf(await login('a@b.co'));
    await me(cookie);
    await logout(cookie);
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
