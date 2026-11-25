import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import { clearFavorites, clearSession, replaceSession, store } from '~/store';
import type { AuthSession } from '~/types';

import type { RestoreSessionResult } from './types';

/** The read operation of this Task: resolve the current session cookie. */
const fetchSession = (): Promise<AuthSession> =>
  requestJson<AuthSession>(buildApiUrl('/api/auth/me'));

/**
 * The boot-restore Task: asks the backend who the current session cookie
 * belongs to and mirrors the answer into the session Entity. A 401 (signed
 * out) and any network failure both end in the signed-out state, and the
 * favorites mirror of a previous user is reset too. It takes no arguments,
 * never reads the store and only mutates it through `store.dispatch`; the
 * outcome is returned and never thrown.
 */
export const restoreSession = async (): Promise<RestoreSessionResult> => {
  try {
    const session = await fetchSession();

    store.dispatch(replaceSession(session));

    return { status: 'success', session };
  } catch (error) {
    store.dispatch(clearSession());
    store.dispatch(clearFavorites());

    return { status: 'error', message: toErrorMessage(error) };
  }
};
