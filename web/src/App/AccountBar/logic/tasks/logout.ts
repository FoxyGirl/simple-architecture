import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import { clearFavorites, clearSession, store } from '~/store';
import type { AuthSession } from '~/types';

import type { LogoutResult } from './types';

/** The write operation of this Task: end the session on the backend. */
const endSession = (): Promise<AuthSession> =>
  requestJson<AuthSession>(buildApiUrl('/api/auth/logout'), {
    method: 'POST',
  });

/**
 * The logout Task: ends the backend session, which also clears the browser's
 * session cookie. Only a success clears the session Entity and the favorites
 * mirror — a failed logout must not pretend the user signed out. It only
 * mutates the store through `store.dispatch` and returns the outcome.
 */
export const logout = async (): Promise<LogoutResult> => {
  try {
    await endSession();

    store.dispatch(clearSession());
    store.dispatch(clearFavorites());

    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
};
