import type { Show } from '@api/types';

/**
 * The genre/page filter applied to a result set. It is bound to the data it
 * was made for, so `data` is null until the first selection is made.
 */
export interface Selection {
  data: Show[] | null;
  genre: string;
  page: number;
}

/**
 * A new selection, always bound to a concrete result set.
 */
export interface SelectionChange {
  data: Show[];
  genre: string;
  page: number;
}
