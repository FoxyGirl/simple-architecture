import type { Show } from '@api/types';

import type { SearchStatus } from './constants';

export type SearchSnapshot = {
  status: SearchStatus;
  data: Show[];
  queryEcho: string;
};

/**
 * A partial snapshot — the search flow reports status and data separately.
 */
export type SearchChange = Partial<SearchSnapshot>;

export type SearchControls = {
  retry: () => void;
  clearSearch: () => void;
};
