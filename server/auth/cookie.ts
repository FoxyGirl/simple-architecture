// The session cookie is the only credential the backend issues: an opaque
// token in an HttpOnly cookie. The attributes are built here so the backend
// needs no cookie or session middleware; a session cookie (no `Max-Age`)
// survives a browser reload and disappears with the browser, matching the
// in-memory store it points at.
export const SESSION_COOKIE_NAME = 'screenscout_session';

const SESSION_COOKIE_ATTRIBUTES = 'Path=/; HttpOnly; SameSite=Lax';

/** The `Set-Cookie` value that issues a session token. */
export const sessionCookieHeader = (token: string): string =>
  `${SESSION_COOKIE_NAME}=${token}; ${SESSION_COOKIE_ATTRIBUTES}`;

/** The `Set-Cookie` value that expires the session cookie on logout. */
export const clearedSessionCookie = (): string =>
  `${SESSION_COOKIE_NAME}=; ${SESSION_COOKIE_ATTRIBUTES}; Max-Age=0`;

/**
 * Reads the session token out of a raw `Cookie` header. Other cookies are
 * ignored, and a missing header or a missing/empty token answers `null`.
 */
export const parseSessionCookie = (
  header: string | undefined,
): string | null => {
  if (!header) return null;

  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');

    if (name === SESSION_COOKIE_NAME) {
      const value = rest.join('=');

      return value === '' ? null : value;
    }
  }

  return null;
};
