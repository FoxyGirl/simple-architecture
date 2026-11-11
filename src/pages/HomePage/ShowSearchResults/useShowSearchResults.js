import { useMemo, useState } from 'react';

import { ALL_GENRES } from './constants.js';
import {
  clampPage,
  filterShowsByGenre,
  getPageCount,
  getPageShows,
  resolveSelection,
} from './utils';

export const useShowSearchResults = ({ data }) => {
  // The selection belongs to the result set it was made for, so a new result
  // set always starts unfiltered and on its first page.
  const [selection, setSelection] = useState({
    data: null,
    genre: ALL_GENRES,
    page: 1,
  });

  const shows = useMemo(() => {
    const { genre, page } = resolveSelection(selection, data);
    const matching = filterShowsByGenre(data, genre);
    return getPageShows(
      matching,
      clampPage(page, getPageCount(matching.length)),
    );
  }, [selection, data]);

  return { shows, selection, onSelectionChange: setSelection };
};
