import type { SignInLocationState } from '../types';

/**
 * Read the Home URL carried in the sign-in navigation state. A missing or
 * malformed state yields null, so callers fall back to the bare Home.
 */
export const readFromHome = (
  state: SignInLocationState | null,
): string | null => {
  if (state === null || typeof state !== 'object') return null;

  const fromHome: unknown = state.fromHome;

  return typeof fromHome === 'string' ? fromHome : null;
};
