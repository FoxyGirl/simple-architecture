import type { RootState } from '../types';
import type { SearchSession } from './types';

/** The search state to restore on a HomePage remount; null on a fresh start. */
export const selectSearchSession = (state: RootState): SearchSession | null =>
  state.searchSession;
