import type { AuthSession } from '~/types';

/**
 * The outcome of the sign-in Task, returned to the modal presenter.
 * `'success'` carries the session the backend answered (dispatched verbatim);
 * `'error'` carries the backend message the modal renders inline.
 */
export type SignInResult =
  | { status: 'success'; session: AuthSession }
  | { status: 'error'; message: string };
