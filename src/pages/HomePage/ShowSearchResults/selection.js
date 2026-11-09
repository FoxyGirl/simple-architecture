import { ALL_GENRES } from './constants.js';

/**
 * Resolve the stored selection against the current result set. The selection
 * belongs to the result set it was made for, so a selection made for another
 * result set resolves to unfiltered and on its first page.
 */
export const resolveSelection = (selection, data) =>
  selection.data === data ? selection : { data, genre: ALL_GENRES, page: 1 };
