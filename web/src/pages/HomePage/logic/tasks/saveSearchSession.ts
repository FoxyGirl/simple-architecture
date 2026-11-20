import type { SearchSession } from '@store';
import { replaceSearchSession, store } from '@store';

/**
 * The search-session Task: persists the search that just succeeded so a
 * later HomePage mount within the same app session can restore it. The
 * caller supplies the explicit session (query + served selection); the
 * Task only dispatches, it never reads the store.
 */
export const saveSearchSession = (session: SearchSession): void => {
  store.dispatch(replaceSearchSession(session));
};
