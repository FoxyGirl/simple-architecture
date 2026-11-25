import { randomUUID } from 'node:crypto';

// The in-memory session store required by the PRD: a plain object keyed by an
// opaque token, each entry holding the normalized email it belongs to. It
// lives in the server process memory — a restart clears every session, and
// the app-level suites reset it through this exported seam. The token is a
// `randomUUID`, so two sessions for the same email never collide.
export const sessions: Record<string, string> = {};

/** Start a session for the email and return its freshly issued token. */
export const createSession = (email: string): string => {
  const token = randomUUID();

  sessions[token] = email;

  return token;
};

/** The email a token belongs to, or `null` for an unknown/absent token. */
export const resolveSessionEmail = (token: string | null): string | null => {
  if (token === null || token === '') return null;

  return sessions[token] ?? null;
};

/** End a session; destroying an unknown token is a no-op (logout is idempotent). */
export const destroySession = (token: string | null): void => {
  if (token === null || token === '') return;

  delete sessions[token];
};
