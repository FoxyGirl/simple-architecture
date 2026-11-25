import type { AuthSession } from '~/types';

/**
 * The outcome of the boot-restore Task, returned to the App presenter.
 * `'success'` carries the session the backend answered (which was dispatched
 * verbatim); `'error'` carries the message of a 401 or network failure.
 */
export type RestoreSessionResult =
  | { status: 'success'; session: AuthSession }
  | { status: 'error'; message: string };
