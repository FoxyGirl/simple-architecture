import { Router } from 'express';

import {
  clearedSessionCookie,
  createSession,
  destroySession,
  isEmail,
  normalizeEmail,
  parseSessionCookie,
  resolveSessionEmail,
  sessionCookieHeader,
} from '@server/auth';

import type { AuthSession } from './types';

/**
 * Email-only authentication routes. Mounted under `/api` by `app.ts`, so
 * they answer `POST /api/auth/login`, `GET /api/auth/me` and
 * `POST /api/auth/logout`. Login validates the address, starts an in-memory
 * session and issues the HttpOnly session cookie; `me` resolves that cookie;
 * logout destroys the session and always answers `{ email: null }`, so it is
 * idempotent. Authentication never calls TVmaze.
 */
export const authRouter = Router();

const authSession = (email: string | null): AuthSession => ({ email });

authRouter.post('/auth/login', (req, res) => {
  const { email } = (req.body ?? {}) as { email?: unknown };
  const normalized = typeof email === 'string' ? normalizeEmail(email) : '';

  if (!isEmail(normalized)) {
    res.status(400).json({ error: 'Request body must carry a valid "email"' });
    return;
  }

  const token = createSession(normalized);

  res.setHeader('Set-Cookie', sessionCookieHeader(token));
  res.json(authSession(normalized));
});

authRouter.get('/auth/me', (req, res) => {
  const email = resolveSessionEmail(parseSessionCookie(req.headers.cookie));

  if (email === null) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  res.json(authSession(email));
});

authRouter.post('/auth/logout', (req, res) => {
  destroySession(parseSessionCookie(req.headers.cookie));

  res.setHeader('Set-Cookie', clearedSessionCookie());
  res.json(authSession(null));
});
