// The shared backend authentication module: the session store, the cookie
// transport and the email rules. Routes import this barrel, never a file
// inside it.
export {
  clearedSessionCookie,
  parseSessionCookie,
  SESSION_COOKIE_NAME,
  sessionCookieHeader,
} from './cookie';
export { isEmail, normalizeEmail } from './email';
export {
  createSession,
  destroySession,
  resolveSessionEmail,
  sessions,
} from './session';
