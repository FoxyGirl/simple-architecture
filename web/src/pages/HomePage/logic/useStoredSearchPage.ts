import { useSelector } from 'react-redux';

import type { SearchPage } from '~/api/types';
import {
  selectGenres,
  selectPage,
  selectPageCount,
  selectShows,
  selectTotalCount,
} from '~/store';

/**
 * The current search result assembled from the shows Entity's selectors —
 * the Presenter's single window onto the application data the Tasks store.
 */
export const useStoredSearchPage = (): SearchPage => {
  const shows = useSelector(selectShows);
  const page = useSelector(selectPage);
  const pageCount = useSelector(selectPageCount);
  const totalCount = useSelector(selectTotalCount);
  const genres = useSelector(selectGenres);

  return { shows, page, pageCount, totalCount, genres };
};
