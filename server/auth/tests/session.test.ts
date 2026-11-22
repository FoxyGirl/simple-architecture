import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearedSessionCookie,
  createSession,
  destroySession,
  isEmail,
  normalizeEmail,
  parseSessionCookie,
  resolveSessionEmail,
  sessionCookieHeader,
  sessions,
} from '../index';

describe('email sessions', () => {
  beforeEach(() => {
    for (const token of Object.keys(sessions)) delete sessions[token];
  });

  it('createSession records a non-empty token that resolves to the email', () => {
    const token = createSession('a@b.co');

    expect(token).not.toBe('');
    expect(sessions[token]).toBe('a@b.co');
    expect(resolveSessionEmail(token)).toBe('a@b.co');
  });

  it('resolveSessionEmail answers null for an unknown or empty token', () => {
    expect(resolveSessionEmail('missing')).toBeNull();
    expect(resolveSessionEmail('')).toBeNull();
    expect(resolveSessionEmail(null)).toBeNull();
  });

  it('destroySession invalidates the token and is a no-op the second time', () => {
    const token = createSession('a@b.co');

    destroySession(token);

    expect(resolveSessionEmail(token)).toBeNull();
    expect(() => destroySession(token)).not.toThrow();
  });

  it('two sessions for the same email get distinct tokens', () => {
    const first = createSession('a@b.co');
    const second = createSession('a@b.co');

    expect(first).not.toBe(second);
    expect(resolveSessionEmail(first)).toBe('a@b.co');
    expect(resolveSessionEmail(second)).toBe('a@b.co');
  });

  it('normalizeEmail trims and lowercases the address', () => {
    expect(normalizeEmail('  A@B.Co  ')).toBe('a@b.co');
  });

  it('isEmail accepts an address shape and rejects non-emails', () => {
    expect(isEmail('a@b.co')).toBe(true);

    for (const invalid of ['', 'a', 'a@b', 'a b@c.co']) {
      expect(isEmail(invalid)).toBe(false);
    }
  });

  it('sessionCookieHeader builds an HttpOnly session cookie', () => {
    expect(sessionCookieHeader('token-1')).toBe(
      'screenscout_session=token-1; Path=/; HttpOnly; SameSite=Lax',
    );
  });

  it('parseSessionCookie reads the token among other cookies', () => {
    expect(parseSessionCookie('screenscout_session=token-1')).toBe('token-1');
    expect(
      parseSessionCookie('theme=dark; screenscout_session=token-1; x=1'),
    ).toBe('token-1');
  });

  it('parseSessionCookie answers null for a missing or unrelated header', () => {
    expect(parseSessionCookie(undefined)).toBeNull();
    expect(parseSessionCookie('')).toBeNull();
    expect(parseSessionCookie('theme=dark')).toBeNull();
  });

  it('clearedSessionCookie expires the session cookie', () => {
    expect(clearedSessionCookie()).toContain('Max-Age=0');
  });
});
