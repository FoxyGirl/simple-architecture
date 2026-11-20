import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ALL_GENRES } from '../ShowSearchResults/constants';
import { parseSearchState, serializeSearchState } from './urlState';

/**
 * The HomePage URL as application state: the current values plus the writes
 * that keep the URL authoritative. A debounced search replaces the current
 * history entry and resets genre/page; genre and page selections push new
 * entries so back/forward walk the visited views.
 */
export const useUrlSearchState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, genre, page } = parseSearchState(searchParams);

  const applySearch = useCallback(
    (value: string) => {
      setSearchParams(
        serializeSearchState({ search: value, genre: ALL_GENRES, page: 1 }),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Changing the genre invalidates the current page.
  const selectGenre = useCallback(
    (nextGenre: string) => {
      setSearchParams(
        serializeSearchState({ search, genre: nextGenre, page: 1 }),
      );
    },
    [setSearchParams, search],
  );

  const selectPage = useCallback(
    (nextPage: number) => {
      setSearchParams(serializeSearchState({ search, genre, page: nextPage }));
    },
    [setSearchParams, search, genre],
  );

  // An unknown genre is corrected after the fetch; the page is preserved.
  const resetGenre = useCallback(() => {
    setSearchParams(serializeSearchState({ search, genre: ALL_GENRES, page }), {
      replace: true,
    });
  }, [setSearchParams, search, page]);

  return {
    search,
    genre,
    page,
    applySearch,
    selectGenre,
    selectPage,
    resetGenre,
  };
};
