import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { UrlSearchState } from '../types';

import { ALL_GENRES } from '../ShowSearchResults/constants';
import {
  hasSearchParams,
  parseSearchState,
  serializeSearchState,
} from './urlState';

/**
 * The HomePage URL as application state: the current values plus the writes
 * that keep the URL authoritative. A debounced search replaces the current
 * history entry and resets genre/page; genre and page selections push new
 * entries so back/forward walk the visited views.
 *
 * `seed` is the transitional in-session fallback: it stands in for the URL
 * only on a parameter-less mount, and any write dismisses it for good.
 */
export const useUrlSearchState = (seed: UrlSearchState | null = null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [seedDismissed, setSeedDismissed] = useState(false);

  const parsed = parseSearchState(searchParams);
  const fallbackActive =
    seed !== null && !seedDismissed && !hasSearchParams(searchParams);
  const current = fallbackActive ? seed : parsed;
  const { search, genre, page } = current;

  const applySearch = useCallback(
    (value: string) => {
      setSeedDismissed(true);
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
      setSeedDismissed(true);
      setSearchParams(
        serializeSearchState({ search, genre: nextGenre, page: 1 }),
      );
    },
    [setSearchParams, search],
  );

  const selectPage = useCallback(
    (nextPage: number) => {
      setSeedDismissed(true);
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
    fallbackActive,
    applySearch,
    selectGenre,
    selectPage,
    resetGenre,
  };
};
