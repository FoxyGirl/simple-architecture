import { useCallback, useRef, useState } from 'react';

import type {
  SearchChange,
  SearchControls,
  SearchRequest,
  SearchSnapshot,
  Selection,
} from './types';

import { STATUS } from './constants';
import { ALL_GENRES } from './ShowSearchResults/constants';
import { useShowsDataFetching } from './useShowsDataFetching';

const INITIAL_SELECTION: Selection = { genre: ALL_GENRES, page: 1 };

const toRequest = (query: string, selection: Selection): SearchRequest => ({
  query,
  genre: selection.genre === ALL_GENRES ? undefined : selection.genre,
  page: selection.page,
});

export const useHomePage = () => {
  const [snapshot, setSnapshot] = useState<SearchSnapshot>({
    status: STATUS.IDLE,
    data: null,
    queryEcho: '',
    selection: INITIAL_SELECTION,
  });

  const handleSearchChange = useCallback((change: SearchChange) => {
    setSnapshot((prevSnapshot) => ({ ...prevSnapshot, ...change }));
  }, []);

  const { runRequest, abortSearch, isCurrentQuery, requestRef } =
    useShowsDataFetching(handleSearchChange);

  // A submitted search starts fresh: first page, no genre filter.
  const submitSearch = useCallback(
    (query: string) => {
      setSnapshot((prevSnapshot) => ({
        ...prevSnapshot,
        selection: INITIAL_SELECTION,
      }));

      void runRequest(toRequest(query, INITIAL_SELECTION));
    },
    [runRequest],
  );

  // A selection change re-requests the same query with the new genre/page;
  // the backend filters and paginates, reusing its TVmaze cache.
  const applySelection = useCallback(
    (selection: Selection) => {
      setSnapshot((prevSnapshot) => ({ ...prevSnapshot, selection }));

      const query = requestRef.current?.query;
      if (query !== undefined) void runRequest(toRequest(query, selection));
    },
    [requestRef, runRequest],
  );

  // Changing the genre invalidates the current page.
  const selectGenre = useCallback(
    (genre: string) => applySelection({ genre, page: 1 }),
    [applySelection],
  );

  const selectPage = useCallback(
    (page: number) => applySelection({ genre: snapshot.selection.genre, page }),
    [applySelection, snapshot.selection.genre],
  );

  // Retry re-issues the current q/genre/page request as it stands.
  const retry = useCallback(() => {
    const current = requestRef.current;
    if (current) void runRequest(current);
  }, [requestRef, runRequest]);

  const controlsRef = useRef<SearchControls | null>(null);

  const registerControls = useCallback((controls: SearchControls | null) => {
    controlsRef.current = controls;
  }, []);

  const clearSearch = () => {
    controlsRef.current?.clearSearch();
  };

  return {
    data: snapshot.data,
    queryEcho: snapshot.queryEcho,
    status: snapshot.status,
    selection: snapshot.selection,
    onSearchChange: handleSearchChange,
    registerControls,
    submitSearch,
    selectGenre,
    selectPage,
    isCurrentQuery,
    abortSearch,
    retry,
    clearSearch,
  };
};
