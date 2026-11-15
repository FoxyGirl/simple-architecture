import type { Show } from '@api/types';

import type { Selection } from '../types';

import { ALL_GENRES } from '../constants';

/**
 * Resolve the stored selection against the current result set. The selection
 * belongs to the result set it was made for, so a selection made for another
 * result set resolves to unfiltered and on its first page.
 */
export const resolveSelection = (
  selection: Selection,
  data: Show[],
): Selection =>
  selection.data === data ? selection : { data, genre: ALL_GENRES, page: 1 };
