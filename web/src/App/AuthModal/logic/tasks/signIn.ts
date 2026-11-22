import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import { clearFavorites, replaceSession, store } from '~/store';
import type { AuthSession } from '~/types';

import type { SignInResult } from './types';

/** The write operation of this Task: start a session for the address. */
const login = (email: string): Promise<AuthSession> =>
  requestJson<AuthSession>(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    body: { email: email.trim() },
  });

/**
 * The sign-in Task: submits the email to the backend, which starts the
 * session and issues the HttpOnly cookie the browser attaches itself. A
 * success clears the favorites mirror of any previous user and stores the
 * returned session verbatim; a rejected login leaves both Entities unchanged
 * so the modal can report the backend message. It only mutates the store
 * through `store.dispatch` and returns the discriminated outcome.
 */
export const signIn = async (email: string): Promise<SignInResult> => {
  try {
    const session = await login(email);

    store.dispatch(clearFavorites());
    store.dispatch(replaceSession(session));

    return { status: 'success', session };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
};
