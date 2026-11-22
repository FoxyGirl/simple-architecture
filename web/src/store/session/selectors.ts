import type { RootState } from '../types';
import type { SessionState } from './types';

/** The signed-in email, or `null` while signed out. */
export const selectSessionEmail = (state: RootState): SessionState['email'] =>
  state.session.email;

/** Whether the app has a signed-in user. */
export const selectIsAuthenticated = (state: RootState): boolean =>
  state.session.email !== null;
