import { useState } from 'react';

import type { Show } from '@api/types';

import type { Selection, SelectionChange } from './types';

import { ALL_GENRES } from './constants';
import {
  clampPage,
  filterShowsByGenre,
  getPageCount,
  getPageShows,
  resolveSelection,
} from './utils';

export const useShowSearchResults = (data: Show[]) => {
  // The selection belongs to the result set it was made for, so a new result
  // set always starts unfiltered and on its first page.
  const [selection, setSelection] = useState<Selection>({
    data: null,
    genre: ALL_GENRES,
    page: 1,
  });

  const { genre, page } = resolveSelection(selection, data);
  const matching = filterShowsByGenre(data, genre);
  const shows = getPageShows(
    matching,
    clampPage(page, getPageCount(matching.length)),
  );

  const onSelectionChange = (change: SelectionChange) => {
    setSelection(change);
  };

  return { shows, selection, onSelectionChange };
};
